import PageShell from "../../components/common/PageShell";
import { useLang } from "../../store/CmsStore";

// TODO: chờ Product cung cấp nội dung About Us chính thức (địa chỉ, giới thiệu chi tiết, hình ảnh...)
export default function AboutPage() {
  const [lang] = useLang();

  return (
    <PageShell>
      <main className="mx-auto max-w-[1100px] px-4 py-8 lg:px-8">
        <section className="rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-500 p-8 text-white">
          <div className="text-xs font-black tracking-wide text-white/75">
            {lang === "en" ? "About" : "Giới thiệu"}
          </div>
          <h1 className="mt-4 text-5xl font-black">
            {lang === "en" ? "About Gundam Store VN" : "Về Gundam Store VN"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/80">
            {lang === "en"
              ? "Gundam Store VN specializes in authentic Bandai Gunpla/Gundam model kits, with in-stock items and pre-orders for upcoming releases."
              : "Gundam Store VN là cửa hàng chuyên mô hình Gunpla/Gundam chính hãng Bandai, với sản phẩm có sẵn và pre-order cho các mẫu sắp về hàng."}
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            {lang === "en" ? "What we do" : "Chúng tôi làm gì"}
          </h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
            {lang === "en"
              ? "We offer authentic Gundam and Gunpla model kits along with builder tools and accessories. For items not currently in stock, customers can pre-order and track their order status on the order lookup page."
              : "Cửa hàng cung cấp mô hình lắp ráp Gundam và Gunpla chính hãng, cùng dụng cụ và phụ kiện hỗ trợ builder. Với những sản phẩm chưa có sẵn tại cửa hàng, khách có thể đặt trước (pre-order) và theo dõi trạng thái đơn hàng qua trang tra cứu đơn."}
          </p>
        </section>
      </main>
    </PageShell>
  );
}
