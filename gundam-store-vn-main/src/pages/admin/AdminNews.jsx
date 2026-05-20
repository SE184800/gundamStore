import { useState } from "react";
import { Edit3, Plus, Trash2, UploadCloud } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { AdminSelect, AdminTextField, AdminTextarea, AdminToggle } from "../../components/admin/AdminField";
import { useCms } from "../../store/CmsStore";
import { fileToBase64 } from "../../utils/mediaUpload";

const emptyArticle = {
  id: "",
  slug: "",
  tag: "Tin tức",
  date: new Date().toISOString().slice(0, 10),
  title: "",
  excerpt: "",
  image: "",
  contentText: "",
  status: "Published",
  featured: false,
};

function makeSlug(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminNews() {
  const { state, actions } = useCms();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyArticle);

  const rows = state.news || [];

  function patch(field, value) {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
      slug: field === "title" && !prev.slug ? makeSlug(value) : prev.slug,
    }));
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    patch("image", base64);
    event.target.value = "";
  }

  function createArticle() {
    setDraft(emptyArticle);
    setOpen(true);
  }

  function editArticle(article) {
    setDraft({
      ...emptyArticle,
      ...article,
      contentText: Array.isArray(article.content) ? article.content.join("\n") : article.contentText || "",
    });
    setOpen(true);
  }

  function saveArticle() {
    actions.saveNewsArticle({
      ...draft,
      slug: draft.slug || makeSlug(draft.title),
      content: String(draft.contentText || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
    });
    setOpen(false);
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Content CMS"
        title="News Management"
        desc="Quản lý tin tức, lịch hàng về, hướng dẫn build, review kit và thông báo preorder."
        action={
          <button onClick={createArticle} className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white">
            <Plus size={15} className="mr-1 inline" />
            Create article
          </button>
        }
      />

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3">Actions</th>
                <th className="px-4 py-3">Thumbnail</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Tag</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Featured</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="group border-t border-slate-100 hover:bg-slate-50">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-slate-50">
                    <button onClick={() => editArticle(item)} className="mr-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold">
                      <Edit3 size={14} className="mr-1 inline" />
                      Edit
                    </button>
                    <button onClick={() => actions.deleteNewsArticle(item.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <img src={item.image} className="h-14 w-24 rounded-md object-cover bg-slate-100" />
                  </td>
                  <td className="px-4 py-3 font-black text-slate-950">{item.title}</td>
                  <td className="px-4 py-3">{item.tag}</td>
                  <td className="px-4 py-3">{item.date}</td>
                  <td className="px-4 py-3"><AdminStatusBadge>{item.status || "Published"}</AdminStatusBadge></td>
                  <td className="px-4 py-3"><AdminStatusBadge>{item.featured ? "Featured" : "Normal"}</AdminStatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer open={open} title={draft.id ? "Edit article" : "Create article"} onClose={() => setOpen(false)} onSave={saveArticle} saveLabel="Save article">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField label="Tiêu đề bài viết" tip="Tiêu đề hiển thị ngoài trang tin tức." value={draft.title} onChange={(v) => patch("title", v)} />
            <AdminTextField label="Slug URL" tip="Đường dẫn bài viết, nên viết thường không dấu." value={draft.slug} onChange={(v) => patch("slug", v)} />
            <AdminSelect label="Tag" value={draft.tag} onChange={(v) => patch("tag", v)} options={["Hàng mới", "Pre-order", "Hướng dẫn", "Build Tips", "Review", "Sự kiện"]} />
            <AdminTextField label="Ngày publish" type="date" value={draft.date} onChange={(v) => patch("date", v)} />
            <AdminSelect label="Trạng thái" value={draft.status} onChange={(v) => patch("status", v)} options={["Published", "Draft"]} />
            <AdminToggle label="Featured article" tip="Bài nổi bật sẽ lên hero news." checked={draft.featured} onChange={(v) => patch("featured", v)} />
          </div>

          <AdminTextarea label="Mô tả ngắn" tip="Hiển thị ở card tin tức." rows={3} value={draft.excerpt} onChange={(v) => patch("excerpt", v)} />

          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="mb-2 text-sm font-black">Thumbnail / Cover</div>
            <div className="mb-3 text-xs font-semibold text-slate-500">Khuyến nghị 1200 x 675 px.</div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-black text-white">
              <UploadCloud size={16} />
              Upload image
              <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
            </label>
            {draft.image && <img src={draft.image} className="mt-4 h-40 rounded-md object-cover" />}
          </div>

          <AdminTextarea label="Nội dung bài viết" tip="Mỗi đoạn xuống một dòng. CMS V1 dùng paragraph đơn giản." rows={8} value={draft.contentText} onChange={(v) => patch("contentText", v)} />
        </div>
      </AdminDrawer>
    </>
  );
}
