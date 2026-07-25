import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { logoutAdmin } from "../../services/AdminAuthService";
import {
  getAdminCatalogReferenceApi,
  getAdminProductsFromApi,
  setAdminProductGroupsApi,
} from "../../services/AdminCatalogApiService";

function isHomepageGroup(group) {
  return !String(group?.code || "").toUpperCase().startsWith("COLLECTION_");
}

function csvEscape(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function buildGroupMappingCsv(products, groupsForColumns) {
  const header = ["SKU", "Ten san pham", ...groupsForColumns.map((group) => group.nameVi || group.code)];
  const lines = [header.map(csvEscape).join(",")];

  for (const product of products) {
    const groupIds = Array.isArray(product.groupIds) ? product.groupIds : [];
    const row = [
      product.sku || "",
      product.nameVi || "",
      ...groupsForColumns.map((group) => (groupIds.includes(group.id) ? "x" : "")),
    ];
    lines.push(row.map(csvEscape).join(","));
  }

  return lines.join("\n");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((cell) => cell !== "")) rows.push(row);
  }

  return rows;
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function clearStorefrontProductCache() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith("gundam-public-api-cache:") &&
        key.includes("/api/products")
      ) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Ignore storage errors.
  }
}

export default function AdminProductGroupMapping() {
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const [rows, ref] = await Promise.all([
        getAdminProductsFromApi(),
        getAdminCatalogReferenceApi(),
      ]);

      setProducts(rows);
      setGroups(ref.groups || []);
    } catch (error) {
      console.error("ADMIN_PRODUCT_GROUP_MAPPING_ERROR", error);
      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return;
      }
      setApiError(error?.message || "Cannot load product group mapping.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((item) =>
      !q ||
      [item.sku, item.slug, item.nameVi, item.nameEn, item.category?.nameVi, item.supplier?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [products, query]);

  const visibleGroups = useMemo(
    () => (showAllGroups ? groups : groups.filter(isHomepageGroup)),
    [groups, showAllGroups]
  );

  async function toggleAndSave(product, groupId) {
    if (savingId) return;

    const currentGroupIds = Array.isArray(product.groupIds)
      ? product.groupIds.filter(Boolean)
      : [];

    const nextGroupIds = currentGroupIds.includes(groupId)
      ? currentGroupIds.filter((id) => id !== groupId)
      : [...currentGroupIds, groupId];

    setSavingId(product.id);
    setApiError("");

    setProducts((prev) =>
      prev.map((item) =>
        item.id === product.id
          ? { ...item, groupIds: nextGroupIds }
          : item
      )
    );

    try {
      const updated = await setAdminProductGroupsApi(
        product.id,
        nextGroupIds
      );

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                ...updated,
                groupIds: updated.groupIds || nextGroupIds,
              }
            : item
        )
      );

      clearStorefrontProductCache();
    } catch (error) {
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...product, groupIds: currentGroupIds }
            : item
        )
      );

      setApiError(error?.message || "Không thể lưu nhóm sản phẩm.");
    } finally {
      setSavingId("");
    }
  }

  function handleExportCsv() {
    const csv = buildGroupMappingCsv(products, visibleGroups);
    downloadTextFile("product-group-mapping.csv", csv);
  }

  async function handleImportCsv(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv") && !file.type.includes("csv")) {
      setImportMessage("Vui lòng chọn file CSV.");
      return;
    }

    setImportBusy(true);
    setImportMessage("");

    try {
      const text = await file.text();
      const parsedRows = parseCsv(text);
      if (!parsedRows.length) {
        setImportMessage("File CSV trống.");
        return;
      }

      const [header, ...dataRows] = parsedRows;
      const skuIdx = header.findIndex((cell) => cell.trim().toLowerCase() === "sku");
      if (skuIdx === -1) {
        setImportMessage("File CSV thiếu cột SKU.");
        return;
      }

      const columnGroups = header
        .map((cell, idx) => {
          if (idx === skuIdx) return null;
          const label = cell.trim();
          const group = visibleGroups.find((g) => (g.nameVi || g.code) === label || g.code === label);
          return group ? { idx, group } : null;
        })
        .filter(Boolean);

      if (!columnGroups.length) {
        setImportMessage("Không tìm thấy cột nhóm hợp lệ trong file (tên cột phải khớp tên nhóm đang hiển thị).");
        return;
      }

      let updated = 0;
      let unchanged = 0;
      const problems = [];

      for (const row of dataRows) {
        const sku = (row[skuIdx] || "").trim();
        if (!sku) continue;

        const product = products.find((item) => item.sku === sku);
        if (!product) {
          problems.push(`${sku} (không tìm thấy)`);
          continue;
        }

        const currentGroupIds = Array.isArray(product.groupIds) ? product.groupIds.filter(Boolean) : [];
        const nextGroupIdSet = new Set(currentGroupIds);

        for (const { idx, group } of columnGroups) {
          const cellValue = (row[idx] || "").trim();
          if (cellValue) nextGroupIdSet.add(group.id);
          else nextGroupIdSet.delete(group.id);
        }

        const nextGroupIds = Array.from(nextGroupIdSet);
        const isSame =
          nextGroupIds.length === currentGroupIds.length &&
          nextGroupIds.every((id) => currentGroupIds.includes(id));

        if (isSame) {
          unchanged += 1;
          continue;
        }

        try {
          const updatedProduct = await setAdminProductGroupsApi(product.id, nextGroupIds);
          setProducts((prev) =>
            prev.map((item) =>
              item.id === product.id
                ? { ...item, ...updatedProduct, groupIds: updatedProduct.groupIds || nextGroupIds }
                : item
            )
          );
          updated += 1;
        } catch (error) {
          problems.push(`${sku} (${error?.message || "lỗi lưu"})`);
        }
      }

      clearStorefrontProductCache();

      const problemText = problems.length
        ? ` Vấn đề: ${problems.slice(0, 10).join(", ")}${problems.length > 10 ? "..." : ""}`
        : "";
      setImportMessage(`Đã cập nhật ${updated} sản phẩm, giữ nguyên ${unchanged}.${problemText}`);
    } finally {
      setImportBusy(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Product Management"
        title="Product Group Mapping"
        desc="Bấm vào nhóm để gán hoặc bỏ gán. Thay đổi được tự động lưu ngay vào database."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="rounded-md border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50"
            >
              Tải CSV xuống
            </button>
            <label className="cursor-pointer rounded-md border border-blue-200 bg-white px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-50">
              {importBusy ? "Đang xử lý..." : "Tải CSV lên"}
              <input type="file" accept=".csv,text/csv" onChange={handleImportCsv} disabled={importBusy} className="hidden" />
            </label>
            <button onClick={() => void reload()} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
              <RefreshCcw size={15} className="mr-1 inline" />
              Refresh
            </button>
          </div>
        }
      />

      {importMessage && (
        <section className="mb-4 rounded-3xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-blue-800">
          {importMessage}
        </section>
      )}

      <section className="mb-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        PostgreSQL Mapping · {loading ? "Loading..." : `${products.length} products · ${groups.length} groups`}
      </section>

      {apiError && <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">{apiError}</section>}

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent px-2 text-sm outline-none" placeholder="Tìm sản phẩm..." />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-500">
            Tải CSV xuống, đánh dấu <b>x</b> vào ô nhóm muốn gán, xoá <b>x</b> để bỏ gán, rồi tải file lên lại. Cột nhóm nào không có trong file sẽ được giữ nguyên.
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase text-slate-400">Hiển thị nhóm:</span>
          <button
            type="button"
            onClick={() => setShowAllGroups(false)}
            className={`rounded-xl px-3 py-1.5 text-xs font-black ${
              !showAllGroups ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-blue-50"
            }`}
          >
            4 nhóm trang chủ
          </button>
          <button
            type="button"
            onClick={() => setShowAllGroups(true)}
            className={`rounded-xl px-3 py-1.5 text-xs font-black ${
              showAllGroups ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-blue-50"
            }`}
          >
            Tất cả nhóm ({groups.length})
          </button>
        </div>
      </section>

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Groups</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => (
              <tr key={product.id} className="border-t border-slate-100 align-top hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl border bg-slate-50">
                      {product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div>
                      <div className="font-black text-slate-950">{product.nameVi}</div>
                      <div className="text-xs text-slate-500">{product.nameEn}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold">{product.sku}</td>
                <td className="px-4 py-3 text-slate-600">{product.category?.nameVi || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {visibleGroups.map((group) => {
                      const checked = product.groupIds?.includes(group.id);
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => void toggleAndSave(product, group.id)}
                          disabled={savingId === product.id}
                          className={`rounded-xl px-3 py-2 text-xs font-black disabled:cursor-wait disabled:opacity-60 ${
                            checked
                              ? "bg-blue-700 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-blue-50"
                          }`}
                        >
                          {group.nameVi}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-flex rounded-full px-3 py-2 text-xs font-black ${
                      savingId === product.id
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {savingId === product.id ? "Đang lưu..." : "Tự động lưu"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
