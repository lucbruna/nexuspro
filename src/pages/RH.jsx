import { useState, useEffect } from "react";
import { C, fmt } from "../constants.js";
import { UserCheck, Plus, Search, Edit, Trash2, X, Save, RefreshCw, Users, DollarSign, Briefcase, Calendar } from "lucide-react";

export default function RH({ toast, api }) {
  const [funcs, setFuncs] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [folha, setFolha] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);

  const load = async () => {
    const params = search ? `?search=${search}` : "";
    const r = await api(`/api/rh${params}`);
    setFuncs(await r.json());
    const f = await api("/api/rh/folha");
    setFolha(await f.json());
    const d = await api("/api/rh/departamentos");
    setDepartamentos(await d.json());
  };

  useEffect(() => { load(); }, [search]);

  const save = async (form) => {
    if (!form.nome) return toast("Nome obrigatório", "error");
    if (editItem) await api(`/api/rh/${editItem.id}`, { method: "PUT", body: JSON.stringify(form) });
    else await api("/api/rh", { method: "POST", body: JSON.stringify(form) });
    toast(editItem ? "Funcionário atualizado!" : "Funcionário cadastrado!", "success");
    setShowForm(false); setEditItem(null); load();
  };

  const del = async (id) => {
    if (!confirm("Excluir funcionário?")) return;
    await api(`/api/rh/${id}`, { method: "DELETE" });
    toast("Funcionário excluído!", "success"); load();
  };

  const cards = folha ? [
    { label: "Total Funcionários", value: folha.funcionarios, icon: Users, color: C.indigo },
    { label: "Folha de Pagamento", value: fmt(folha.total), icon: DollarSign, color: C.green },
    { label: "Salário Médio", value: fmt(folha.media), icon: Briefcase, color: C.cyan },
  ] : [];

  const Form = ({ initial, onSave, onCancel }) => {
    const [f, setF] = useState({ nome: "", cargo: "", departamento: "", salario: 0, admissao: "", telefone: "", email: "", documentos: "", ...initial });
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
        <div className="grid grid-cols-2 gap-3">{I("Nome *", "nome")}{I("Cargo", "cargo")}</div>
        <div className="grid grid-cols-2 gap-3">{S("Departamento", "departamento", [...new Set([...departamentos, "TI", "Financeiro", "RH", "Comercial", "Administrativo"])])}{I("Salário (R$)", "salario", "number")}</div>
        <div className="grid grid-cols-3 gap-3">{I("Data Admissão", "admissao", "date")}{I("Telefone", "telefone")}{I("E-mail", "email", "email")}</div>
        {I("Documentos", "documentos")}
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
        <div><div className="font-bold text-lg" style={{ color: C.text }}>RH & Pessoal</div>
          <div className="text-xs mt-0.5" style={{ color: C.muted }}>Gestão completa de colaboradores</div></div>
        <button onClick={() => { setEditItem(null); setShowForm(true) }} style={{ background: `linear-gradient(135deg,${C.indigo},${C.purple})`, color: "white" }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90"><Plus size={15} />Novo Funcionário</button>
      </div>

      {cards.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {cards.map(c => (
            <div key={c.label} style={{ background: C.card, border: `1px solid ${c.color}25`, borderRadius: 16, padding: 16 }}>
              <div className="flex items-center gap-3 mb-2">
                <div style={{ background: `${c.color}15` }} className="w-9 h-9 rounded-xl flex items-center justify-center"><c.icon size={16} style={{ color: c.color }} /></div>
                <span className="text-xs font-bold" style={{ color: C.muted }}>{c.label}</span>
              </div>
              <div style={{ color: c.color, fontFamily: "monospace" }} className="text-xl font-extrabold">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {showForm && <Form initial={editItem || {}} onSave={save} onCancel={() => { setShowForm(false); setEditItem(null) }} />}

      <div className="flex gap-3 items-center">
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} style={{ color: C.muted, position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou departamento..." style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, width: "100%", borderRadius: 12, padding: "10px 14px 10px 36px", fontSize: 13, outline: "none" }} />
        </div>
        <button onClick={load} style={{ border: `1px solid ${C.border}`, color: C.muted }} className="p-2.5 rounded-xl hover:border-white/20"><RefreshCw size={16} /></button>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
        <table className="w-full">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {["Nome", "Cargo", "Departamento", "Salário", "Admissão", "Contato", "Documentos", "Ações"].map(h => (
              <th key={h} style={{ color: C.muted, padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {funcs.map((f, i) => (
              <tr key={f.id} style={{ borderBottom: i < funcs.length - 1 ? `1px solid ${C.border}` : "none" }} className="hover:bg-white/[0.02]">
                <td style={{ padding: "10px 12px" }}>
                  <div className="flex items-center gap-2">
                    <div style={{ background: `${C.indigo}20`, color: C.indigo }} className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold">{f.nome?.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
                    <span className="text-sm font-semibold" style={{ color: C.text }}>{f.nome}</span>
                  </div>
                </td>
                <td style={{ padding: "10px 12px", color: C.sub, fontSize: 13 }}>{f.cargo}</td>
                <td style={{ padding: "10px 12px" }}><span style={{ background: `${C.cyan}15`, color: C.cyan, border: `1px solid rgba(6,182,212,0.3)`, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 6 }}>{f.departamento}</span></td>
                <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: C.green }}>{fmt(f.salario)}</td>
                <td style={{ padding: "10px 12px", color: C.muted, fontSize: 12 }}>{f.admissao ? new Date(f.admissao).toLocaleDateString("pt-BR") : "—"}</td>
                <td style={{ padding: "10px 12px", color: C.sub, fontSize: 11 }}>{f.telefone || "—"}</td>
                <td style={{ padding: "10px 12px", color: C.muted, fontSize: 11 }}>{f.documentos || "—"}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditItem(f); setShowForm(true) }} style={{ color: C.muted, border: `1px solid ${C.border}` }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-white"><Edit size={11} /></button>
                    <button onClick={() => del(f.id)} style={{ color: C.red }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10"><Trash2 size={11} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
