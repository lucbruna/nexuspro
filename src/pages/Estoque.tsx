import { useState, useEffect } from "react";
import { C, fmt } from "../constants.js";
import { Package, Plus, Search, Edit, Trash2, X, Save, RefreshCw, AlertTriangle } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce.js";
import { SkeletonTable } from "../components/ui/Skeleton.jsx";

export default function Estoque({ toast, api }) {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const searchDeb = useDebounce(search);
  const [categoria, setCategoria] = useState("todas");
  const [categorias, setCategorias] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const params = new URLSearchParams();
    if (searchDeb) params.set("search", searchDeb);
    if (categoria !== "todas") params.set("categoria", categoria);
    const r = await api(`/api/estoque?${params}`);
    setProdutos(await r.json());
    setLoading(false);
  };

  const loadCats = async () => {
    const r = await api("/api/estoque/categorias");
    setCategorias(await r.json());
  };

  useEffect(() => { load(); loadCats(); }, [searchDeb, categoria]);

  const save = async (form) => {
    if (!form.nome || !form.codigo) return toast("Nome e código obrigatórios", "error");
    if (editItem) await api(`/api/estoque/${editItem.id}`, { method: "PUT", body: JSON.stringify(form) });
    else await api("/api/estoque", { method: "POST", body: JSON.stringify(form) });
    toast(editItem ? "Produto atualizado!" : "Produto cadastrado!", "success");
    setShowForm(false); setEditItem(null); load(); loadCats();
  };

  const del = async (id) => {
    if (!confirm("Excluir produto?")) return;
    await api(`/api/estoque/${id}`, { method: "DELETE" });
    toast("Produto excluído!", "success"); load();
  };

  const baixoEstoque = produtos.filter(p => p.quantidade <= 5);
  const totalValor = produtos.reduce((s, p) => s + (p.preco || 0) * (p.quantidade || 0), 0);

  const Form = ({ initial, onSave, onCancel }) => {
    const [f, setF] = useState({ nome: "", codigo: "", categoria: "", quantidade: 0, preco: 0, validade: "", ...initial });
    const I = (l, k, type = "text") => (
      <div><label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: C.sub }}>{l}</label>
        <input type={type} value={f[k] ?? ""} onChange={e => setF({ ...f, [k]: type === "number" ? +e.target.value : e.target.value })}
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, width: "100%", borderRadius: 12, padding: "8px 12px", fontSize: 13, outline: "none" }} /></div>
    );
    const S = (l, k, opts) => (
      <div><label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: C.sub }}>{l}</label>
        <select value={f[k] || ""} onChange={e => setF({ ...f, [k]: e.target.value })}
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, width: "100%", borderRadius: 12, padding: "8px 12px", fontSize: 13, outline: "none" }}>
          <option value="">Selecione...</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select></div>
    );
    return (
      <div style={{ background: C.card2, border: `1px solid ${C.indigoBorder}`, borderRadius: 16, padding: 16 }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">{I("Nome *", "nome")}{I("Código *", "codigo")}</div>
        <div className="grid grid-cols-3 gap-3">{S("Categoria", "categoria", [...new Set([...categorias, "Informática", "Papelaria", "Mobiliário"])])}{I("Quantidade", "quantidade", "number")}{I("Preço (R$)", "preco", "number")}</div>
        {I("Validade", "validade", "date")}
        <div className="flex gap-2">
          <button onClick={onCancel} style={{ border: `1px solid ${C.border}`, color: C.muted }} className="flex-1 py-2.5 rounded-xl text-sm hover:border-white/20">Cancelar</button>
          <button onClick={() => onSave(f)} style={{ background: `linear-gradient(135deg,${C.indigo},${C.purple})`, color: "white" }} className="flex-1 py-2.5 rounded-xl text-sm font-bold hover:opacity-90"><Save size={14} className="inline mr-1" />Salvar</button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><div className="font-bold text-lg" style={{ color: C.text }}>Estoque</div>
          <div className="text-xs mt-0.5" style={{ color: C.muted }}>{produtos.length} produtos · {fmt(totalValor)} em estoque</div></div>
        <button onClick={() => { setEditItem(null); setShowForm(true) }} style={{ background: `linear-gradient(135deg,${C.indigo},${C.purple})`, color: "white" }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90"><Plus size={15} />Novo Produto</button>
      </div>

      {baixoEstoque.length > 0 && (
        <div style={{ background: C.redDim, border: `1px solid rgba(244,63,94,0.3)`, borderRadius: 12, padding: "10px 14px" }} className="flex items-center gap-2">
          <AlertTriangle size={14} style={{ color: C.red }} />
          <span className="text-xs font-bold" style={{ color: C.red }}>{baixoEstoque.length} produtos com estoque baixo (≤5 unidades)</span>
        </div>
      )}

      {showForm && <Form initial={editItem || {}} onSave={save} onCancel={() => { setShowForm(false); setEditItem(null) }} />}

      <div className="flex gap-3 items-center">
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} style={{ color: C.muted, position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou código..." style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, width: "100%", borderRadius: 12, padding: "10px 14px 10px 36px", fontSize: 13, outline: "none" }} />
        </div>
        <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 12, padding: "10px 14px", fontSize: 13, outline: "none" }}>
          <option value="todas">Todas categorias</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={load} style={{ border: `1px solid ${C.border}`, color: C.muted }} className="p-2.5 rounded-xl hover:border-white/20"><RefreshCw size={16} /></button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={7} />
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
          <table className="w-full">
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Código", "Produto", "Categoria", "Qtd", "Preço", "Total", "Validade", "Ações"].map(h => (
                <th key={h} style={{ color: C.muted, padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {produtos.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < produtos.length - 1 ? `1px solid ${C.border}` : "none" }} className="hover:bg-white/[0.02]">
                  <td style={{ padding: "10px 12px" }}><span style={{ color: C.indigo, fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{p.codigo}</span></td>
                  <td style={{ padding: "10px 12px" }}><span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{p.nome}</span></td>
                  <td style={{ padding: "10px 12px" }}><span style={{ color: C.sub, fontSize: 12 }}>{p.categoria}</span></td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ color: p.quantidade <= 5 ? C.red : C.green, fontWeight: 800, fontSize: 13 }}>{p.quantidade}</span>
                    {p.quantidade <= 5 && <AlertTriangle size={10} style={{ color: C.red, marginLeft: 4, display: "inline" }} />}
                  </td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: C.indigo }}>{fmt(p.preco)}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: C.cyan }}>{fmt((p.preco || 0) * (p.quantidade || 0))}</td>
                  <td style={{ padding: "10px 12px", color: C.muted, fontSize: 11 }}>{p.validade || "—"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditItem(p); setShowForm(true) }} style={{ color: C.muted, border: `1px solid ${C.border}` }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-white"><Edit size={11} /></button>
                      <button onClick={() => del(p.id)} style={{ color: C.red }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10"><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
