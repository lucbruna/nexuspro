import { useState, useEffect } from "react";
import { C, fmt, fmtN } from "../constants.js";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, Download, Trash2, RefreshCw, ChevronLeft, ChevronRight, X, Activity } from "lucide-react";

const MESES=["","Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MESES_S=["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function Financeiro({ toast, api, reload }) {
  const [trans,  setTrans]  = useState([]);
  const [total,  setTotal]  = useState(0);
  const [mensal, setMensal] = useState([]);
  const [showAdd,setShowAdd]= useState(false);
  const [fTipo,  setFTipo]  = useState("todos");
  const [mes,    setMes]    = useState(new Date().getMonth()+1);
  const [ano,    setAno]    = useState(new Date().getFullYear());
  const [form,   setForm]   = useState({tipo:"entrada",categoria:"Mensalidade",descricao:"",valor:"",data:new Date().toISOString().split("T")[0],status:"pago"});

  const CATS_E=["Mensalidade","Taxa de Inscrição","Evento","Consultoria","Serviço","Produto","Doação","Outros"];
  const CATS_S=["Aluguel","Folha de Pagamento","Energia","Internet","Material","Limpeza","Software","Marketing","Impostos","Outros"];

  const load=async()=>{
    const p=new URLSearchParams({mes,ano,limit:200});
    if(fTipo!=="todos") p.set("tipo",fTipo);
    const r=await api(`/api/transacoes?${p}`);
    const d=await r.json(); setTrans(d.items||[]); setTotal(d.total||0);
  };

  useEffect(()=>{ load(); },[mes,ano,fTipo]);
  useEffect(()=>{
    api(`/api/analytics/mensal?ano=${ano}`).then(r=>r.json()).then(setMensal).catch(()=>{});
  },[ano]);

  const ent=trans.filter(t=>t.tipo==="entrada").reduce((s,t)=>s+t.valor,0);
  const sai=trans.filter(t=>t.tipo==="saida").reduce((s,t)=>s+t.valor,0);

  const add=async()=>{
    if(!form.descricao||!form.valor) return toast("Preencha descrição e valor","error");
    await api("/api/transacoes",{method:"POST",body:JSON.stringify({...form,valor:+form.valor})});
    toast("Transação registrada!","success"); setShowAdd(false);
    setForm({tipo:"entrada",categoria:"Mensalidade",descricao:"",valor:"",data:new Date().toISOString().split("T")[0],status:"pago"});
    load(); reload();
  };

  const del=async id=>{ if(!confirm("Excluir?")) return; await api(`/api/transacoes/${id}`,{method:"DELETE"}); toast("Removida","info"); load(); };

  const navMes=(dir)=>{
    let nm=mes+dir, na=ano;
    if(nm<1){nm=12;na--;}
    if(nm>12){nm=1;na++;}
    setMes(nm); setAno(na);
  };

  // Categoria breakdown
  const cats={};
  trans.filter(t=>t.tipo==="saida").forEach(t=>{ cats[t.categoria]=(cats[t.categoria]||0)+t.valor; });
  const catList=Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxCat=catList[0]?.[1]||1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div style={{color:C.text}} className="font-bold text-lg">Financeiro</div>
          <div style={{color:C.muted}} className="text-xs">{MESES[mes]} de {ano}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>window.open(`/api/export/financeiro?mes=${mes}&ano=${ano}`)} style={{border:`1px solid ${C.border}`,color:C.muted}} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:border-white/20 transition-colors"><Download size={13}/>Excel</button>
          <button onClick={()=>setShowAdd(!showAdd)} style={{background:`linear-gradient(135deg,${C.indigo},${C.purple})`,color:"white",boxShadow:`0 0 20px ${C.indigo}30`}} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold hover:opacity-90"><Plus size={15}/>Nova Transação</button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-4 gap-4">
        {[[fmt(ent),"Entradas",C.green,TrendingUp,"from-emerald-700 to-teal-900"],[fmt(sai),"Saídas",C.red,TrendingDown,"from-rose-700 to-red-900"],[fmt(ent-sai),"Saldo",ent-sai>=0?C.green:C.red,Wallet,ent-sai>=0?"from-emerald-700 to-teal-900":"from-rose-700 to-red-900"],[fmtN(total),"Transações",C.indigo,Activity,"from-indigo-700 to-violet-900"]].map(([v,l,c,Icon,grad])=>(
          <div key={l} style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl p-5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mb-3`}><Icon size={16} color="white"/></div>
            <div style={{color:C.text,fontFamily:"monospace"}} className="text-xl font-extrabold tabular-nums">{v}</div>
            <div style={{color:C.muted}} className="text-xs mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">
        <div style={{background:C.card,border:`1px solid ${C.border}`}} className="col-span-2 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div style={{color:C.text}} className="font-bold text-sm">Fluxo Anual — {ano}</div>
            <div className="flex gap-1">
              <button onClick={()=>setAno(y=>y-1)} style={{color:C.muted,border:`1px solid ${C.border}`}} className="w-6 h-6 rounded-lg flex items-center justify-center"><ChevronLeft size={12}/></button>
              <button onClick={()=>setAno(y=>y+1)} style={{color:C.muted,border:`1px solid ${C.border}`}} className="w-6 h-6 rounded-lg flex items-center justify-center"><ChevronRight size={12}/></button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={mensal}>
              <defs>
                <linearGradient id="gEF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.3}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="nome" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>`${(v/1000).toFixed(0)}k`} tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,fontSize:11,color:C.text}}/>
              <Area type="monotone" dataKey="entradas" stroke={C.green} strokeWidth={2} fill="url(#gEF)" name="Entradas"/>
              <Bar dataKey="saidas" fill={C.red} opacity={0.5} radius={[2,2,0,0]} name="Saídas" barSize={8}/>
              <Line type="monotone" dataKey="saldo" stroke={C.indigo} strokeWidth={2} dot={false} name="Saldo"/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl p-5">
          <div style={{color:C.text}} className="font-bold text-sm mb-4">Top Despesas</div>
          <div className="space-y-3">
            {catList.length===0?<p style={{color:C.muted}} className="text-xs text-center py-4">Sem saídas neste mês</p>:catList.map(([cat,val])=>(
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{color:C.sub}}>{cat}</span>
                  <span style={{color:C.red,fontFamily:"monospace"}} className="font-bold">{fmt(val)}</span>
                </div>
                <div style={{background:"rgba(255,255,255,0.06)"}} className="h-1.5 rounded-full overflow-hidden">
                  <div style={{width:`${(val/maxCat)*100}%`,background:C.red}} className="h-full rounded-full"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add form */}
      {showAdd&&(
        <div style={{background:C.card,border:`1px solid ${C.indigoBorder}`}} className="rounded-2xl p-5 space-y-4">
          <div style={{color:C.indigo}} className="font-bold text-sm">Nova Transação</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Tipo</label>
              <div className="flex gap-2">
                {["entrada","saida"].map(t=>(
                  <button key={t} onClick={()=>setForm({...form,tipo:t,categoria:t==="entrada"?CATS_E[0]:CATS_S[0]})}
                    style={{background:form.tipo===t?(t==="entrada"?C.greenDim:C.redDim):"transparent",color:form.tipo===t?(t==="entrada"?C.green:C.red):C.muted,border:`1px solid ${form.tipo===t?(t==="entrada"?"rgba(34,197,94,0.3)":"rgba(244,63,94,0.3)"):C.border}`}}
                    className="flex-1 py-2 rounded-xl text-xs font-bold">{t==="entrada"?"↑ Entrada":"↓ Saída"}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Categoria</label>
              <select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:13,outline:"none"}}>
                {(form.tipo==="entrada"?CATS_E:CATS_S).map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Valor (R$)</label>
              <input type="number" min="0" step="0.01" value={form.valor} onChange={e=>setForm({...form,valor:e.target.value})} placeholder="0,00" style={{background:C.surface,border:`1px solid ${C.border}`,color:form.tipo==="entrada"?C.green:C.red,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:14,outline:"none",fontWeight:"bold",fontFamily:"monospace"}}/>
            </div>
            <div className="col-span-2">
              <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Descrição</label>
              <input value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} placeholder="Descrição da transação..." style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:13,outline:"none"}} onKeyDown={e=>e.key==="Enter"&&add()}/>
            </div>
            <div>
              <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Data</label>
              <input type="date" value={form.data} onChange={e=>setForm({...form,data:e.target.value})} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:13,outline:"none"}}/>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>setShowAdd(false)} style={{border:`1px solid ${C.border}`,color:C.muted}} className="flex-1 py-2.5 rounded-xl text-sm hover:border-white/20">Cancelar</button>
            <button onClick={add} style={{background:`linear-gradient(135deg,${C.indigo},${C.purple})`,color:"white"}} className="flex-1 py-2.5 rounded-xl text-sm font-extrabold hover:opacity-90">Registrar</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={()=>navMes(-1)} style={{color:C.muted,border:`1px solid ${C.border}`}} className="w-7 h-7 rounded-lg flex items-center justify-center hover:border-white/20"><ChevronLeft size={13}/></button>
          <span style={{color:C.indigo}} className="text-sm font-bold w-32 text-center">{MESES[mes]} {ano}</span>
          <button onClick={()=>navMes(1)} style={{color:C.muted,border:`1px solid ${C.border}`}} className="w-7 h-7 rounded-lg flex items-center justify-center hover:border-white/20"><ChevronRight size={13}/></button>
        </div>
        <div className="flex gap-1">
          {["todos","entrada","saida"].map(t=>(
            <button key={t} onClick={()=>setFTipo(t)} style={{background:fTipo===t?(t==="entrada"?C.greenDim:t==="saida"?C.redDim:C.indigoDim):"transparent",color:fTipo===t?(t==="entrada"?C.green:t==="saida"?C.red:C.indigo):C.muted,border:`1px solid ${fTipo===t?(t==="entrada"?"rgba(34,197,94,0.3)":t==="saida"?"rgba(244,63,94,0.3)":C.indigoBorder):C.border}`}} className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all">
              {t==="todos"?"Todas":t==="entrada"?"Entradas":"Saídas"}
            </button>
          ))}
        </div>
        <span style={{color:C.muted}} className="text-xs ml-auto">{total} transações</span>
      </div>

      {/* Lista */}
      <div style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr style={{background:C.card2,borderBottom:`1px solid ${C.border}`}}>
            {["Tipo","Categoria","Descrição","Valor","Data",""].map(h=><th key={h} style={{color:C.muted,padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em"}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {trans.map((t,i)=>(
              <tr key={t.id} style={{borderBottom:i<trans.length-1?`1px solid ${C.border}`:"none"}} className="hover:bg-white/[0.015] transition-colors">
                <td style={{padding:"10px 14px"}}><span style={{color:t.tipo==="entrada"?C.green:C.red,background:`${t.tipo==="entrada"?C.green:C.red}18`,border:`1px solid ${t.tipo==="entrada"?"rgba(34,197,94,0.3)":"rgba(244,63,94,0.3)"}`,fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:6,display:"inline-flex",alignItems:"center",gap:4}}><span>{t.tipo==="entrada"?"↑":"↓"}</span>{t.tipo==="entrada"?"Entrada":"Saída"}</span></td>
                <td style={{padding:"10px 14px",color:C.sub,fontSize:12}}>{t.categoria}</td>
                <td style={{padding:"10px 14px",color:C.text,fontSize:13}}>{t.descricao}</td>
                <td style={{padding:"10px 14px"}}><span style={{color:t.tipo==="entrada"?C.green:C.red,fontFamily:"monospace",fontWeight:800,fontSize:13}}>{t.tipo==="entrada"?"+":"-"}{fmt(t.valor)}</span></td>
                <td style={{padding:"10px 14px",color:C.muted,fontSize:12}}>{t.data}</td>
                <td style={{padding:"10px 14px"}}><button onClick={()=>del(t.id)} style={{color:C.red,background:C.redDim}} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-colors"><Trash2 size={12}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {trans.length===0&&<div className="py-12 text-center"><DollarSign size={32} style={{color:C.muted}} className="mx-auto mb-2 opacity-30"/><p style={{color:C.muted}} className="text-sm">Nenhuma transação encontrada</p></div>}
      </div>
    </div>
  );
}
