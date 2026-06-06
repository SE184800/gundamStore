import { prisma } from "../config/prisma.js";

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getPeriodStart(period = "7d") {
  const today = startOfDay(new Date());

  if (period === "24h") return new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (period === "30d") return addDays(today, -29);
  if (period === "90d") return addDays(today, -89);

  return addDays(today, -6);
}

function cleanText(value = "", max = 200) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function csvEscape(value = "") {
  const text = typeof value === "object" && value !== null
    ? JSON.stringify(value)
    : String(value ?? "");

  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function toCsv(rows = []) {
  const headers = [
    { key: "createdAt", label: "Created At" },
    { key: "actor", label: "Actor" },
    { key: "actorEmail", label: "Actor Email" },
    { key: "action", label: "Action" },
    { key: "entity", label: "Entity" },
    { key: "entityId", label: "Entity ID" },
    { key: "orderNo", label: "Order No" },
    { key: "metadata", label: "Metadata" },
  ];

  const head = headers.map((item) => csvEscape(item.label)).join(",");
  const body = rows
    .map((row) => headers.map((item) => csvEscape(row[item.key])).join(","))
    .join("\n");

  return `${head}\n${body}`;
}

function mapAuditLog(log = {}) {
  return {
    id: log.id,
    actorId: log.actorId || "",
    actor: log.actor?.name || log.actor?.email || "System",
    actorEmail: log.actor?.email || "",
    orderId: log.orderId || "",
    orderNo: log.order?.orderNo || "",
    action: log.action,
    entity: log.entity,
    entityId: log.entityId || "",
    metadata: log.metadata || {},
    createdAt: log.createdAt,
  };
}

function summarize(logs = []) {
  const actionMap = {};
  const entityMap = {};
  const actorMap = {};

  for (const log of logs) {
    actionMap[log.action] = (actionMap[log.action] || 0) + 1;
    entityMap[log.entity] = (entityMap[log.entity] || 0) + 1;
    actorMap[log.actor] = (actorMap[log.actor] || 0) + 1;
  }

  return {
    total: logs.length,
    uniqueActors: Object.keys(actorMap).length,
    orderRelated: logs.filter((item) => item.orderId || item.orderNo).length,
    systemEvents: logs.filter((item) => item.actor === "System").length,
    actions: Object.entries(actionMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    entities: Object.entries(entityMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    actors: Object.entries(actorMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
  };
}

async function getAuditRows(req) {
  const period = cleanText(req.query.period || "7d", 20);
  const action = cleanText(req.query.action || "ALL", 120);
  const entity = cleanText(req.query.entity || "ALL", 120);
  const actorId = cleanText(req.query.actorId || "", 120);
  const orderId = cleanText(req.query.orderId || "", 120);
  const q = cleanText(req.query.q || "", 120).toLowerCase();
  const take = Math.min(Math.max(Number(req.query.take || 300), 50), 1000);

  const rows = await prisma.auditLog.findMany({
    where: {
      createdAt: {
        gte: getPeriodStart(period),
      },
      ...(action !== "ALL" ? { action } : {}),
      ...(entity !== "ALL" ? { entity } : {}),
      ...(actorId ? { actorId } : {}),
      ...(orderId ? { orderId } : {}),
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      order: {
        select: {
          id: true,
          orderNo: true,
          customerName: true,
          customerPhone: true,
          status: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take,
  });

  let mapped = rows.map(mapAuditLog);

  if (q) {
    mapped = mapped.filter((log) =>
      [
        log.actor,
        log.actorEmail,
        log.action,
        log.entity,
        log.entityId,
        log.orderNo,
        JSON.stringify(log.metadata || {}),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  return mapped;
}

export async function listAdminAuditLogs(req, res, next) {
  try {
    const logs = await getAuditRows(req);

    res.json({
      success: true,
      logs,
      summary: summarize(logs),
      filters: {
        actions: Array.from(new Set(logs.map((item) => item.action))).sort(),
        entities: Array.from(new Set(logs.map((item) => item.entity))).sort(),
      },
      generatedAt: new Date(),
    });
  } catch (error) {
    next(error);
  }
}

export async function exportAdminAuditLogsCsv(req, res, next) {
  try {
    const logs = await getAuditRows(req);
    const csv = toCsv(logs);
    const filename = `gundam-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    next(error);
  }
}
