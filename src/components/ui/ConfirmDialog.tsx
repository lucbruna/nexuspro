import { C } from "../../constants.js";
import { Modal } from "./Modal.jsx";
import { AlertTriangle } from "lucide-react";

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirmar", danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title || "Confirmação"}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div style={{ background: danger ? C.redDim : C.amberDim, borderRadius: 12, padding: 8, flexShrink: 0 }}>
            <AlertTriangle size={20} style={{ color: danger ? C.red : C.amber }} />
          </div>
          <p style={{ color: C.sub }} className="text-sm leading-relaxed">{message || "Tem certeza?"}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            style={{ border: `1px solid ${C.border}`, color: C.muted }}
            className="flex-1 py-2.5 rounded-xl text-sm hover:border-white/20 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onConfirm?.(); onClose(); }}
            style={{
              background: danger ? `linear-gradient(135deg,${C.red},#e11d48)` : `linear-gradient(135deg,${C.indigo},${C.purple})`,
              color: "white"
            }}
            className="flex-1 py-2.5 rounded-xl text-sm font-extrabold hover:opacity-90 transition-opacity"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
