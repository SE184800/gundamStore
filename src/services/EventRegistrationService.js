const EVENT_REGISTRATION_KEY = "gundam-event-registrations";

function readRows() {
  try {
    const parsed = JSON.parse(localStorage.getItem(EVENT_REGISTRATION_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRows(rows) {
  localStorage.setItem(EVENT_REGISTRATION_KEY, JSON.stringify(Array.isArray(rows) ? rows : []));
}

function sanitize(value = "", max = 255) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizePhone(value = "") {
  return String(value || "").replace(/[^\d+]/g, "").trim();
}

export function getEventRegistrations(eventId = "") {
  const rows = readRows();
  if (!eventId) return rows;
  return rows.filter((row) => row.eventId === eventId);
}

export function getEventRegistrationSummary() {
  const rows = readRows();
  const byEvent = rows.reduce((acc, row) => {
    acc[row.eventId] = (acc[row.eventId] || 0) + 1;
    return acc;
  }, {});

  return {
    total: rows.length,
    pending: rows.filter((row) => row.status === "Pending").length,
    confirmed: rows.filter((row) => row.status === "Confirmed").length,
    cancelled: rows.filter((row) => row.status === "Cancelled").length,
    byEvent,
  };
}

export function registerEvent(event, payload = {}) {
  if (!event?.id) {
    throw new Error("Event not found.");
  }

  const name = sanitize(payload.name, 80);
  const phone = normalizePhone(payload.phone);
  const email = sanitize(payload.email, 120);
  const note = sanitize(payload.note, 300);

  if (!name || name.length < 2) {
    throw new Error("Vui lòng nhập họ tên hợp lệ.");
  }

  if (!/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone)) {
    throw new Error("Số điện thoại không hợp lệ.");
  }

  const rows = readRows();
  const duplicated = rows.some(
    (row) => row.eventId === event.id && row.phone === phone && row.status !== "Cancelled"
  );

  if (duplicated) {
    throw new Error("Số điện thoại này đã đăng ký sự kiện.");
  }

  const row = {
    id: `EVR-${Date.now()}`,
    eventId: event.id,
    eventTitle: event.title || "",
    name,
    phone,
    email,
    note,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  writeRows([row, ...rows]);
  return row;
}

export function updateEventRegistrationStatus(id, status = "Confirmed") {
  const rows = readRows().map((row) =>
    row.id === id
      ? {
          ...row,
          status,
          updatedAt: new Date().toISOString(),
        }
      : row
  );

  writeRows(rows);
  return rows;
}

export function deleteEventRegistration(id) {
  const rows = readRows().filter((row) => row.id !== id);
  writeRows(rows);
  return rows;
}
