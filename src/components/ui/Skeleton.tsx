import { C } from "../../constants.js";

export function SkeletonCard({ lines = 2 }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="skeleton-box" style={{ width: 40, height: 40, borderRadius: 12 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton-box" style={{ width: "60%", height: 14, borderRadius: 4, marginBottom: 6 }} />
          <div className="skeleton-box" style={{ width: "40%", height: 10, borderRadius: 4 }} />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-box" style={{ width: `${80 - i * 15}%`, height: 10, borderRadius: 4, marginBottom: 8 }} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ background: C.card2, borderBottom: `1px solid ${C.border}`, padding: "10px 14px" }}>
        <div className="flex gap-6">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="skeleton-box" style={{ width: `${60 + Math.random() * 40}px`, height: 10, borderRadius: 4 }} />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ borderBottom: r < rows - 1 ? `1px solid ${C.border}` : "none", padding: "12px 14px" }}>
          <div className="flex gap-6">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="skeleton-box" style={{ width: `${50 + Math.random() * 80}px`, height: 12, borderRadius: 4 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonLine({ width = "100%", height = 12 }) {
  return <div className="skeleton-box" style={{ width, height, borderRadius: 4 }} />;
}
