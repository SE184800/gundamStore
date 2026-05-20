import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  Globe2,
  Layers3,
  MonitorSmartphone,
  Plus,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import {
  AdminImageUploader,
  AdminSelect,
  AdminTextarea,
  AdminTextField,
  AdminToggle,
} from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import AdminTabs from "../../components/admin/AdminTabs";
import { useCms } from "../../store/CmsStore";

const tabs = [
  { key: "pages", label: "Pages" },
  { key: "home", label: "Home Builder" },
  { key: "banners", label: "Banners" },
  { key: "navigation", label: "Navigation" },
  { key: "media", label: "Media" },
  { key: "theme", label: "Theme / SEO" },
];

const demoPages = [
  { id: "home", title: "Home page", slug: "/", language: "VI / EN", status: "Published", updated: "10 phút trước" },
  { id: "shop", title: "Shop page", slug: "/shop", language: "VI / EN", status: "Published", updated: "2 giờ trước" },
  { id: "product", title: "Product detail template", slug: "/product/:slug", language: "VI / EN", status: "Published", updated: "Hôm qua" },
  { id: "preorder", title: "Pre-order guide", slug: "/preorder-guide", language: "VI / EN", status: "Draft", updated: "3 ngày trước" },
];

const demoSections = [
  { id: "hero", name: "Hero Slider", source: "Manual banners", layout: "Full width slider", status: "Published", sort: 1 },
  { id: "trust", name: "Trust Strip", source: "Static CMS", layout: "4 columns", status: "Published", sort: 2 },
  { id: "category", name: "Product Categories", source: "Product Categories", layout: "Sidebar + icons", status: "Draft", sort: 3 },
  { id: "new", name: "Hàng mới về", source: "Group: New Arrivals", layout: "Product grid 2 rows", status: "Published", sort: 4 },
  { id: "order", name: "Hàng order", source: "Group: Pre-order", layout: "Product grid 2 rows", status: "Published", sort: 5 },
  { id: "sale", name: "Hàng Sales", source: "Group: Sale", layout: "Product grid 2 rows", status: "Published", sort: 6 },
];

const demoBanners = [
  { id: "b1", title: "RG Hi-ν Back in Stock", placement: "Homepage Hero", device: "Desktop + Mobile", status: "Live", schedule: "Now" },
  { id: "b2", title: "Builder Tool Combo", placement: "Below Categories", device: "Desktop", status: "Scheduled", schedule: "20:00 Today" },
  { id: "b3", title: "Pre-order MGEX", placement: "Shop Top", device: "All", status: "Draft", schedule: "Not set" },
];

function getTabFromPath(pathname) {
  if (pathname.includes("/cms/pages")) return "pages";
  if (pathname.includes("/cms/banners")) return "banners";
  if (pathname.includes("/cms/navigation")) return "navigation";
  if (pathname.includes("/cms/media")) return "media";
  if (pathname.includes("/cms/theme-seo")) return "theme";
  return "home";
}

function CmsPreview() {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-black text-slate-950">Live preview</div>
          <div className="text-xs font-semibold text-slate-500">Xem nhanh layout trước khi publish.</div>
        </div>
        <div className="flex gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
          <button className="rounded bg-blue-700 px-2 py-1 text-xs font-black text-white">
            <MonitorSmartphone size={13} className="mr-1 inline" />
            Desktop
          </button>
          <button className="rounded px-2 py-1 text-xs font-black text-slate-500">Mobile</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500">
          gundamstore.vn
        </div>

        <div className="p-3">
          <div className="mb-3 h-28 rounded-md bg-gradient-to-r from-blue-700 to-cyan-500 p-4 text-white">
            <div className="text-xs font-black uppercase tracking-wider text-white/70">Hero Slider</div>
            <div className="mt-2 text-xl font-black">GUNDAM / GUNPLA</div>
            <div className="mt-1 text-xs font-semibold text-white/80">Banner lấy từ CMS Banner Manager</div>
          </div>

          <div className="mb-3 grid grid-cols-4 gap-2">
            {["Fast ship", "Mint box", "Authentic", "Builder perks"].map((item) => (
              <div key={item} className="rounded-md border border-slate-200 bg-white p-2 text-center text-[10px] font-black text-slate-600">
                {item}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[92px_1fr] gap-3">
            <div className="space-y-2">
              {["HG", "RG", "MG", "PG"].map((item) => (
                <div key={item} className="rounded-md bg-white px-2 py-2 text-xs font-black text-blue-700">
                  {item}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {["Hàng mới về", "Hàng order", "Hàng bán chạy"].map((title) => (
                <div key={title} className="rounded-md border border-slate-200 bg-white p-3">
                  <div className="mb-2 text-xs font-black text-blue-700">{title}</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-16 rounded-md bg-gradient-to-br from-slate-200 to-blue-100" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PagesTable({ openDrawer }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-base font-black text-slate-950">Pages</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Quản lý template, static page, SEO và ngôn ngữ.
          </p>
        </div>
        <button onClick={() => openDrawer("page")} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
          <Plus size={15} />
          Create page
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Page name</th>
              <th className="px-4 py-3">URL path</th>
              <th className="px-4 py-3">Language</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {demoPages.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-black text-slate-950">{row.title}</td>
                <td className="px-4 py-3 font-bold text-slate-500">{row.slug}</td>
                <td className="px-4 py-3 font-bold text-slate-600">{row.language}</td>
                <td className="px-4 py-3"><AdminStatusBadge>{row.status}</AdminStatusBadge></td>
                <td className="px-4 py-3 text-slate-500">{row.updated}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openDrawer("page")} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HomeBuilderTable({ openDrawer }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-base font-black text-slate-950">Home Builder sections</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Sắp xếp layout trang chủ, nguồn sản phẩm và trạng thái publish.
          </p>
        </div>

        <div className="flex gap-2">
          <button className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Eye size={14} className="mr-1 inline" />
            Preview
          </button>

          <button onClick={() => openDrawer("section")} className="rounded-md bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
            <Plus size={14} className="mr-1 inline" />
            Add section
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Display order</th>
              <th className="px-4 py-3">Section name</th>
              <th className="px-4 py-3">Product source</th>
              <th className="px-4 py-3">Website layout</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {demoSections.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-black text-slate-500">#{row.sort}</td>
                <td className="px-4 py-3 font-black text-slate-950">{row.name}</td>
                <td className="px-4 py-3 text-slate-600">{row.source}</td>
                <td className="px-4 py-3 text-slate-600">{row.layout}</td>
                <td className="px-4 py-3"><AdminStatusBadge>{row.status}</AdminStatusBadge></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openDrawer("section")} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    Configure
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BannersTable({ openDrawer }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-base font-black text-slate-950">Banner Manager</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Quản lý slider, banner quảng cáo, lịch publish và thiết bị hiển thị.
          </p>
        </div>

        <button onClick={() => openDrawer("banner")} className="rounded-md bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
          <UploadCloud size={14} className="mr-1 inline" />
          Create banner
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Preview</th>
              <th className="px-4 py-3">Banner name</th>
              <th className="px-4 py-3">Website position</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Publish time</th>
            </tr>
          </thead>
          <tbody>
            {demoBanners.map((row, index) => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className={`h-12 w-24 rounded-md bg-gradient-to-r ${index === 0 ? "from-blue-700 to-cyan-500" : index === 1 ? "from-slate-900 to-blue-600" : "from-violet-700 to-fuchsia-500"}`} />
                </td>
                <td className="px-4 py-3 font-black text-slate-950">{row.title}</td>
                <td className="px-4 py-3 text-slate-600">{row.placement}</td>
                <td className="px-4 py-3 text-slate-600">{row.device}</td>
                <td className="px-4 py-3"><AdminStatusBadge>{row.status}</AdminStatusBadge></td>
                <td className="px-4 py-3 text-slate-600">{row.schedule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NavigationPanel({ openDrawer }) {
  const items = ["Trang chủ", "Shop", "Hàng mới", "Pre-order", "Tools", "Hướng dẫn Pre-order"];

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-950">Navigation menu</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">Menu header chính ngoài website.</p>
          </div>

          <button onClick={() => openDrawer("navigation")} className="rounded-md bg-blue-700 px-3 py-2 text-xs font-black text-white">
            Add menu item
          </button>
        </div>

        {items.map((item, index) => (
          <div key={item} className="mb-2 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-400">#{index + 1}</span>
              <span className="text-sm font-black text-slate-950">{item}</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </div>
        ))}
      </div>

      <CmsPreview />
    </div>
  );
}

function MediaPanel({ openDrawer }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-950">Media Library</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Kho ảnh dùng chung cho banner, category icon, sản phẩm và SEO.
          </p>
        </div>

        <button onClick={() => openDrawer("media")} className="rounded-md bg-blue-700 px-3 py-2 text-xs font-black text-white">
          <UploadCloud size={14} className="mr-1 inline" />
          Upload files
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["Hero", "Product card", "Category icon", "Banner ad", "Box photo", "Gallery", "Logo", "SEO image"].map((item, index) => (
          <div key={item} className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
            <div className={`h-28 bg-gradient-to-br ${index % 3 === 0 ? "from-blue-700 to-cyan-500" : index % 3 === 1 ? "from-slate-800 to-blue-500" : "from-amber-500 to-orange-200"}`} />
            <div className="p-3">
              <div className="text-sm font-black text-slate-950">{item}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">image/webp • 1200px</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemeSeoPanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-base font-black text-slate-950">Theme settings</h2>
        <div className="mt-4 space-y-4">
          <AdminTextField label="Màu chính của website" tip="Dùng cho nút chính, link, trạng thái active và các điểm nhấn quan trọng." placeholder="#1D4ED8" value="#1D4ED8" />
          <AdminTextField label="Màu phụ / accent" tip="Dùng cho badge, khuyến mãi, icon hoặc highlight phụ." placeholder="#06B6D4" value="#06B6D4" />
          <AdminSelect label="Kiểu bo góc button" tip="Nên giữ đồng nhất toàn website để giao diện chuyên nghiệp." options={["Bo nhẹ", "Bo vừa", "Bo tròn nhiều"]} value="Bo vừa" />
          <AdminSelect label="Mật độ product card" tip="Compact hiển thị nhiều sản phẩm hơn, Comfortable giúp ảnh nổi bật hơn." options={["Compact", "Comfortable", "Large image"]} value="Comfortable" />
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-base font-black text-slate-950">SEO defaults</h2>
        <div className="mt-4 space-y-4">
          <AdminTextField label="Tiêu đề SEO mặc định" tip="Nên dưới 60 ký tự. Dùng khi trang chưa có SEO riêng." placeholder="Gundam Store VN - Gunpla chính hãng" value="Gundam Store VN - Gunpla chính hãng" required />
          <AdminTextarea label="Mô tả SEO mặc định" tip="Nên khoảng 120–160 ký tự để hiển thị đẹp trên Google." placeholder="Mô tả ngắn về website..." value="Website bán Gundam, Gunpla, model kit chính hãng, hàng sẵn và pre-order." rows={4} />
          <AdminImageUploader label="Ảnh chia sẻ mặc định" tip="Hiển thị khi link website được chia sẻ lên Facebook, Zalo hoặc Messenger." recommended="1200 x 630 px" />
        </div>
      </div>
    </div>
  );
}

function SectionDrawerContent() {
  return (
    <div className="space-y-5">
      <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        <b>Section là gì?</b> Section là một khối hiển thị trên trang chủ, ví dụ Hero Slider, Hàng mới về, Hàng Sales hoặc danh mục icon.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AdminTextField label="Tên section trong admin" tip="Chỉ dùng để quản lý nội bộ, khách hàng không nhìn thấy tên này." placeholder="Ví dụ: Home - Hàng mới về" value="Home - Hàng mới về" required />
        <AdminTextField label="Tiêu đề hiển thị ngoài website" tip="Đây là tiêu đề khách hàng sẽ thấy trên trang chủ." placeholder="Ví dụ: Hàng mới về" value="Hàng mới về" required />
        <AdminSelect label="Nguồn sản phẩm" tip="Chọn nhóm sản phẩm để hệ thống tự kéo sản phẩm vào block này." options={["Group: Hàng mới về", "Group: Pre-order", "Group: Bán chạy", "Group: Sales", "Chọn sản phẩm thủ công"]} value="Group: Hàng mới về" required />
        <AdminSelect label="Kiểu hiển thị" tip="Quyết định cách section xuất hiện trên website." options={["Grid 2 dòng", "Slider ngang", "Banner ngang", "Danh mục icon", "Trust strip"]} value="Grid 2 dòng" required />
        <AdminTextField label="Số sản phẩm tối đa" tip="Giới hạn số sản phẩm hiển thị để trang không quá dài." placeholder="Ví dụ: 8" value="8" suffix="items" />
        <AdminTextField label="Thứ tự hiển thị" tip="Số nhỏ sẽ hiện trước. Ví dụ 1 là đầu trang, 5 là sau các section trước đó." placeholder="Ví dụ: 4" value="4" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AdminToggle label="Hiển thị trên website" tip="Tắt nếu section chưa sẵn sàng hoặc đang chuẩn bị nội dung." checked />
        <AdminToggle label="Hiển thị trên mobile" tip="Một số banner hoặc section lớn có thể tắt riêng trên mobile." checked />
      </div>
    </div>
  );
}

function BannerDrawerContent() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <AdminTextField label="Tên banner trong admin" tip="Chỉ dùng để tìm kiếm và quản lý nội bộ, không hiển thị ngoài website." placeholder="Ví dụ: Hero RG Hi-ν tháng 06" value="Hero RG Hi-ν tháng 06" required />
        <AdminSelect label="Vị trí hiển thị banner" tip="Chọn nơi banner sẽ xuất hiện trên storefront." options={["Hero trang chủ", "Dưới danh mục", "Đầu trang shop", "Trang chi tiết sản phẩm", "Cart/Checkout"]} value="Hero trang chủ" required />
        <AdminTextField label="Tiêu đề chính trên banner" tip="Dòng chữ lớn nhất khách hàng nhìn thấy." placeholder="Ví dụ: RG Hi-ν Gundam đã về hàng" value="RG Hi-ν Gundam đã về hàng" />
        <AdminTextField label="Dòng mô tả ngắn" tip="Giải thích thêm về ưu đãi, hàng mới hoặc thông điệp bán hàng." placeholder="Ví dụ: Hàng Bandai chính hãng, bọc chống sốc 3 lớp" value="Hàng Bandai chính hãng, bọc chống sốc 3 lớp" />
        <AdminTextField label="Chữ trên nút CTA" tip="Nên ngắn, rõ hành động. Ví dụ: Mua ngay, Xem hàng mới, Pre-order." placeholder="Mua ngay" value="Mua ngay" />
        <AdminTextField label="Link khi bấm banner" tip="Điền URL nội bộ như /shop hoặc /product/rg-hi-nu." placeholder="/shop" value="/shop" />
      </div>

      <AdminImageUploader label="Ảnh banner desktop" tip="Ảnh lớn cho màn hình máy tính. Nên chừa khoảng trống để đặt chữ." recommended="1600 x 560 px" required />
      <AdminImageUploader label="Ảnh banner mobile" tip="Ảnh tối ưu cho điện thoại, tránh chữ quá nhỏ." recommended="900 x 900 px" />
      <AdminToggle label="Cho phép publish banner" tip="Bật khi banner đã kiểm tra hình, link và thời gian đăng." checked />
    </div>
  );
}

function PageDrawerContent() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <AdminTextField label="Tên trang" tip="Tên dùng trong admin để dễ nhận biết." placeholder="Ví dụ: Hướng dẫn Pre-order" value="Hướng dẫn Pre-order" required />
        <AdminTextField label="Đường dẫn URL" tip="Đường dẫn khách hàng sẽ truy cập. Nên viết thường, không dấu." placeholder="/preorder-guide" value="/preorder-guide" required />
        <AdminSelect label="Loại trang" tip="Chọn đúng loại để hệ thống dùng layout phù hợp." options={["Static content", "Landing page", "Product template", "Policy page"]} value="Static content" />
        <AdminSelect label="Ngôn ngữ" tip="Có thể tạo nội dung riêng cho tiếng Việt và tiếng Anh." options={["VI + EN", "VI only", "EN only"]} value="VI + EN" />
      </div>
      <AdminTextField label="Tiêu đề SEO" tip="Nên dưới 60 ký tự để Google hiển thị đẹp." placeholder="Hướng dẫn Pre-order Gundam" value="Hướng dẫn Pre-order Gundam" />
      <AdminTextarea label="Mô tả SEO" tip="Nên khoảng 120–160 ký tự, tóm tắt nội dung trang." placeholder="Mô tả ngắn cho công cụ tìm kiếm..." rows={3} />
      <AdminToggle label="Publish trang này" tip="Tắt nếu trang chưa hoàn thiện nội dung." checked={false} />
    </div>
  );
}

function NavigationDrawerContent() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <AdminTextField label="Tên menu hiển thị" tip="Tên khách hàng sẽ thấy trên header/menu." placeholder="Ví dụ: Pre-order" value="Pre-order" required />
      <AdminTextField label="Link menu" tip="URL nội bộ hoặc bên ngoài. Ví dụ: /shop?group=preorder." placeholder="/shop?group=preorder" value="/shop?group=preorder" required />
      <AdminTextField label="Thứ tự hiển thị" tip="Số nhỏ sẽ đứng trước trong menu." placeholder="4" value="4" />
      <AdminSelect label="Mở link ở đâu" tip="Nên dùng cùng tab cho link nội bộ, tab mới cho link bên ngoài." options={["Cùng tab", "Tab mới"]} value="Cùng tab" />
      <AdminToggle label="Hiển thị menu" tip="Tắt nếu chưa muốn khách thấy menu này." checked />
    </div>
  );
}

function MediaDrawerContent() {
  return (
    <div className="space-y-5">
      <AdminImageUploader label="File hình ảnh" tip="Upload file dùng cho banner, sản phẩm, SEO hoặc icon danh mục." recommended="JPG, PNG, WebP" required />
      <div className="grid gap-4 md:grid-cols-2">
        <AdminTextField label="Tên media" tip="Tên nội bộ để tìm lại ảnh trong thư viện." placeholder="Ví dụ: hero-rg-hi-nu-06" />
        <AdminSelect label="Mục đích sử dụng" tip="Giúp lọc media nhanh hơn khi chọn ảnh." options={["Banner", "Product image", "Category icon", "SEO image", "Logo", "Other"]} value="Banner" />
        <AdminTextField label="Alt text" tip="Mô tả ảnh cho SEO và accessibility." placeholder="RG Hi-ν Gundam hero banner" />
        <AdminTextField label="Tags" tip="Dùng dấu phẩy để gắn tag, ví dụ: hero, rg, hi-nu." placeholder="hero, rg, hi-nu" />
      </div>
    </div>
  );
}

export default function AdminStorefrontCMS() {
  const { state } = useCms();
  const location = useLocation();
  const [manualTab, setManualTab] = useState("");
  const [drawerType, setDrawerType] = useState(null);

  const urlTab = getTabFromPath(location.pathname);
  const activeTab = manualTab || urlTab;

  const safeBanners = Array.isArray(state?.banners) && state.banners.length
    ? state.banners.slice(0, 20).map((item, index) => ({
        id: item.id || `banner-${index}`,
        title: item.title?.vi || item.title || item.name || `Banner ${index + 1}`,
        placement: item.placement || item.position || "Homepage Hero",
        device: item.device || "Desktop + Mobile",
        status: item.status || (item.active === false ? "Draft" : "Live"),
        schedule: item.schedule || item.publishAt || "Now",
      }))
    : demoBanners;

  const body = useMemo(() => {
    if (activeTab === "pages") return <PagesTable openDrawer={setDrawerType} />;

    if (activeTab === "home") {
      return (
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <HomeBuilderTable openDrawer={setDrawerType} />
          <CmsPreview />
        </div>
      );
    }

    if (activeTab === "banners") return <BannersTable banners={safeBanners} openDrawer={setDrawerType} />;
    if (activeTab === "navigation") return <NavigationPanel openDrawer={setDrawerType} />;
    if (activeTab === "media") return <MediaPanel openDrawer={setDrawerType} />;

    return <ThemeSeoPanel />;
  }, [activeTab, safeBanners]);

  const drawerTitle = {
    section: "Configure homepage section",
    banner: "Create / Edit banner",
    page: "Create / Edit page",
    navigation: "Create / Edit menu item",
    media: "Upload media file",
  }[drawerType];

  const drawerSubtitle = {
    section: "Field names are business-friendly, each field has tips and examples.",
    banner: "Set banner content, placement, schedule, CTA and image slots.",
    page: "Manage page URL, language, SEO and publish status.",
    navigation: "Control header/footer menu labels, links and order.",
    media: "Upload images and add searchable metadata.",
  }[drawerType];

  const drawerBody = {
    section: <SectionDrawerContent />,
    banner: <BannerDrawerContent />,
    page: <PageDrawerContent />,
    navigation: <NavigationDrawerContent />,
    media: <MediaDrawerContent />,
  }[drawerType];

  return (
    <>
      <AdminPageHeader
        eyebrow="Storefront Content Management"
        title="Storefront CMS chuẩn vận hành"
        desc="Quản lý Pages, Home Builder, Banner, Navigation, Media, Theme và SEO. Tất cả field có tên dễ hiểu, tips và ví dụ nhập liệu."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
              <Eye size={14} className="mr-1 inline" />
              Preview site
            </button>
            <button className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800">
              <Globe2 size={14} className="mr-1 inline" />
              Publish changes
            </button>
          </div>
        }
      />

      <section className="mb-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <Layers3 size={20} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-950">{demoSections.length}</div>
              <div className="text-xs font-bold text-slate-500">CMS sections</div>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-950">4</div>
              <div className="text-xs font-bold text-slate-500">Published items</div>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-50 text-amber-700">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-950">2</div>
              <div className="text-xs font-bold text-slate-500">Draft changes</div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <AdminTabs tabs={tabs} active={activeTab} onChange={setManualTab} />
        <div className="p-4">{body}</div>
      </section>

      <AdminDrawer
        open={Boolean(drawerType)}
        title={drawerTitle}
        subtitle={drawerSubtitle}
        onClose={() => setDrawerType(null)}
        onSave={() => setDrawerType(null)}
      >
        {drawerBody}
      </AdminDrawer>
    </>
  );
}
