import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { AdminToggle } from "../../components/admin/AdminField";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";
import {
  getAdminFeatureAccessRules,
  updateAdminFeatureAccessRule,
} from "../../services/FeatureAccessApiService";

const FEATURE_LABELS = {
  product_review_submit: "Gửi đánh giá sản phẩm",
  event_registration: "Đăng ký sự kiện",
  restock_alert: "Đăng ký báo hàng lại",
};

export default function AdminFeatureAccess() {
  const { toast, notify, dismiss } = useToast();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingCode, setSavingCode] = useState("");

  useEffect(() => {
    let alive = true;

    getAdminFeatureAccessRules()
      .then((rows) => {
        if (alive) setRules(rows);
      })
      .catch((error) => {
        if (alive) notify("error", error?.message || "Không tải được danh sách quyền truy cập.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleRule(rule, nextRequiresAuth) {
    setSavingCode(rule.featureCode);

    try {
      const updated = await updateAdminFeatureAccessRule(rule.featureCode, nextRequiresAuth);
      setRules((prev) => prev.map((row) => (row.featureCode === rule.featureCode ? updated : row)));
      notify("success", "Đã cập nhật.");
    } catch (error) {
      notify("error", error?.message || "Không cập nhật được quyền truy cập.");
    } finally {
      setSavingCode("");
    }
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <AdminPageHeader
        eyebrow="Settings"
        title="Quyền truy cập tính năng"
        desc="Bật/tắt yêu cầu đăng nhập cho từng tính năng khách vãng lai có thể dùng ở storefront."
      />

      <section className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        <div className="flex items-start gap-2">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" />
          <div>
            <b>Lưu ý:</b> Các khu vực <b>Tài khoản</b>, <b>Đơn hàng của tôi</b> (bao gồm cả <b>Wishlist</b>, vì route
            thật của wishlist nằm dưới <code>/api/account/*</code>) và toàn bộ <b>Admin</b> không nằm trong danh
            sách này — các khu vực đó luôn bắt buộc đăng nhập vì lý do bảo mật và không thể tắt qua màn hình này.
          </div>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="divide-y divide-slate-100">
          {loading && (
            <div className="p-5 text-sm font-bold text-slate-500">Đang tải...</div>
          )}

          {!loading && rules.length === 0 && (
            <div className="p-5 text-sm font-bold text-slate-500">Chưa có dữ liệu.</div>
          )}

          {!loading && rules.map((rule) => (
            <div key={rule.featureCode} className="p-4">
              <AdminToggle
                label={FEATURE_LABELS[rule.featureCode] || rule.label || rule.featureCode}
                tip={
                  rule.requiresAuth
                    ? "Đang yêu cầu đăng nhập trước khi dùng tính năng này."
                    : "Đang mở cho khách vãng lai (không cần đăng nhập)."
                }
                checked={Boolean(rule.requiresAuth)}
                onChange={(next) => toggleRule(rule, next)}
              />
              {savingCode === rule.featureCode && (
                <div className="mt-1 text-xs font-bold text-blue-600">Đang lưu...</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
