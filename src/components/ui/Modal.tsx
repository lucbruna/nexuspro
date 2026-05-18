import { C } from "../../constants.js";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children, wide }: { open: any; onClose: any; title: any; children: any; wide?: any }) {
  if (!open) return null;
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(2,4,8,0.92)", backdropFilter: "blur(8px)" }}
      className="flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
      onKeyDown={e => e.key === "Escape" && onClose()}
    >
      <div
        style={{
          background: C.card, border: `1px solid ${C.border2}`,
          width: "100%", maxWidth: wide ? 880 : 560, maxHeight: "90vh",
          overflowY: "auto", borderRadius: 20, boxShadow: "0 40px 80px rgba(0,0,0,0.6)"
        }}
      >
        <div
          style={{
            borderBottom: `1px solid ${C.border}`, background: C.card,
            borderRadius: "20px 20px 0 0", position: "sticky", top: 0, zIndex: 1
          }}
          className="flex items-center justify-between px-6 py-4"
        >
          <h3 style={{ color: C.text }} className="font-bold text-base">{title}</h3>
          <button onClick={onClose} style={{ color: C.muted }} className="hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
