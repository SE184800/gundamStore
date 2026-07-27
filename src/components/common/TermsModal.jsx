import { X, ShieldCheck, Scale, PackageCheck } from "lucide-react";

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      {/* KHUNG MODAL CHÍNH */}
      <div className="relative flex h-full max-h-[560px] w-full max-w-[520px] flex-col rounded-5xl border border-slate-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* HEADER MODAL */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Scale size={18} />
            </div>
            <h3 className="text-base font-black text-slate-900">Điều khoản dịch vụ và chính sách bảo mật</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* NỘI DUNG ĐIỀU KHOẢN (CUỘN CHUỘT) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs font-semibold leading-relaxed text-slate-600 CustomScrollbar">

          {/* MỤC 1 */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
              <ShieldCheck size={14} className="text-blue-600" /> 1. Quy định tài khoản thành viên
            </h4>
            <p>
              Khi đăng ký tài khoản tại Gundam Store VN, bạn cam kết cung cấp thông tin chính xác về Họ tên và Email. Bạn có trách nhiệm tự bảo mật mật khẩu cá nhân của mình. Hệ thống có quyền tạm khóa các tài khoản có dấu hiệu tạo bot bẩn hoặc spam request gây ảnh hưởng tới Neon Database của hệ thống.
            </p>
          </div>

          {/* MỤC 2 */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
              <PackageCheck size={14} className="text-blue-600" /> 2. Chính sách Đặt hàng & Pre-Order
            </h4>
            <p>
              Đối với các sản phẩm mô hình lắp ráp Gunpla phiên bản giới hạn (P-Bandai) hoặc hàng đặt trước (Pre-order): Thành viên cần tuân thủ đúng thời hạn thanh toán và quy trình xử lý đơn hàng. Mọi hành vi hủy đơn vô cớ quá số lần quy định sẽ bị hệ thống hạ cấp bậc xếp hạng thành viên (Quyền USER).
            </p>
          </div>

          {/* MỤC 3 */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
              <ShieldCheck size={14} className="text-blue-600" /> 3. Chính sách bảo mật thông tin
            </h4>
            <p>
              Gundam Store VN cam kết bảo mật tuyệt đối thông tin cá nhân của bạn. Mật khẩu của bạn đã được mã hóa băm một chiều bằng thuật toán bảo mật cấp cao trước khi ghi nhận xuống cơ sở dữ liệu. Chúng tôi tuyệt đối không cung cấp thông tin của bạn cho bất kỳ bên thứ ba nào ngoại trừ đơn vị vận chuyển đối tác.
            </p>
          </div>

          {/* MỤC 4 */}
          <div className="space-y-2">
            <h4 className="font-black text-slate-900 text-sm">4. Điều khoản bổ sung</h4>
            <p>
              Chúng tôi có quyền cập nhật các điều khoản này theo quy định phân phối đồ chơi chính ngạch tại thị trường Việt Nam. Mọi thay đổi lớn sẽ được thông báo trực tiếp qua Banner tại trang Tin tức (Community News) trên hệ thống Header của cửa hàng.
            </p>
          </div>

        </div>

        {/* FOOTER MODAL NÚT ĐÓNG */}
        <div className="border-t border-slate-100 p-5 bg-slate-50/50 rounded-b-5xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
          >
            Đóng lại
          </button>
        </div>

      </div>
    </div>
  );
}