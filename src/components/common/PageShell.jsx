import Header from "./Header";
import Footer from "./Footer";
import FloatingChat from "./FloatingChat";

export default function PageShell({ children, withFooter = true }) {
  return (
    <div className="min-h-screen bg-[#f6f9fd] text-slate-900">
      <div className="pointer-events-none fixed inset-0 opacity-100">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f7fbff] to-[#eef5fc]" />
        <div className="absolute left-[-10%] top-[-15%] h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute right-[-10%] top-20 h-96 w-96 rounded-full bg-cyan-100/70 blur-3xl" />
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage: "linear-gradient(rgba(37,99,235,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.035) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>
      <Header />
      <main className="relative z-10">{children}</main>
      {withFooter && <Footer />}
      <FloatingChat />
    </div>
  );
}
