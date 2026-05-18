import { useState, useEffect } from "react";
import { C, fmt, fmtN } from "../constants.js";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, Download, Trash2, RefreshCw, ChevronLeft, ChevronRight, X, Activity, FileText, Search, ExternalLink, CheckCircle, Settings, Save } from "lucide-react";

const MESES=["","Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MESES_S=["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function Financeiro({ toast, api, reload }) {
  const [trans,  setTrans]  = useState<any[]>([]);
  const [total,  setTotal]  = useState(0);
  const [mensal, setMensal] = useState<any[]>([]);
  const [showAdd,setShowAdd]= useState(false);
  const [fTipo,  setFTipo]  = useState("todos");
  const [mes,    setMes]    = useState(new Date().getMonth()+1);
  const [ano,    setAno]    = useState(new Date().getFullYear());
  const [form,   setForm]   = useState({tipo:"entrada",categoria:"Mensalidade",descricao:"",valor:"",data:new Date().toISOString().split("T")[0],status:"pago"});
  const [showBol, setShowBol]= useState(false);
  const [bolCli, setBolCli]  = useState<any[]>([]);
  const [bolSearch, setBolSearch]= useState("");
  const [bolSel, setBolSel]  = useState<any>(null);
  const [bolVal, setBolVal]  = useState("");
  const [bolRes, setBolRes]  = useState<any>(null);
  const [bolLoad, setBolLoad] = useState(false);
  const [bolBank, setBolBank] = useState("mercadopago");
  const [bolAgen, setBolAgen] = useState("");
  const [bolCont, setBolCont] = useState("");
  const [bolCart, setBolCart] = useState("09");
  const [bolVenc, setBolVenc] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split("T")[0]; });
  const [bolMulta, setBolMulta] = useState("2");
  const [bolMora, setBolMora] = useState("1.59");
  const [showBankConfig, setShowBankConfig] = useState(false);
  const [bankConfig, setBankConfig] = useState<any>({});
  const [bankConfigLoad, setBankConfigLoad] = useState(false);
  const [showDre, setShowDre] = useState(false);

  useEffect(() => {
    const cfg = bankConfig[bolBank];
    if (cfg) {
      setBolAgen(cfg.agencia || "");
      setBolCont(cfg.conta || "");
      setBolCart(cfg.carteira || "09");
    }
  }, [bolBank, bankConfig]);
  const BANCOS = [
    { id:"mercadopago", label:"Mercado Pago" },
    { id:"banco_do_brasil", label:"Banco do Brasil" },
    { id:"bradesco", label:"Bradesco" },
    { id:"itau", label:"Itaú" },
    { id:"caixa", label:"Caixa Econômica" },
    { id:"santander", label:"Santander" },
  ].map(b => ({ ...b, configured: b.id !== "mercadopago" && !!(bankConfig[b.id]?.agencia && bankConfig[b.id]?.conta) }));

  const CATS_E=["Mensalidade","Taxa de Inscrição","Evento","Consultoria","Serviço","Produto","Doação","Outros"];
  const CATS_S=["Aluguel","Folha de Pagamento","Energia","Internet","Material","Limpeza","Software","Marketing","Impostos","Outros"];

  const load=async()=>{
    const p=new URLSearchParams({mes:String(mes),ano:String(ano),limit:"200"});
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

  const loadCli=async()=>{
    const r=await api("/api/clientes?limit=500");
    if(!r) return;
    const d=await r.json();
    setBolCli(d.items||d||[]);
  };

  const loadBankConfig=async()=>{
    setBankConfigLoad(true);
    try {
      const r=await api("/api/config/bancario");
      if(r&&r.ok){ const d=await r.json(); setBankConfig(d); }
    } catch(e){} finally { setBankConfigLoad(false); }
  };

  const saveBankConfig=async()=>{
    setBankConfigLoad(true);
    try {
      await api("/api/config/bancario",{method:"PUT",body:JSON.stringify(bankConfig)});
      toast("Configuração bancária salva!","success");
    } catch(e){ toast("Erro ao salvar","error"); }
    finally { setBankConfigLoad(false); }
  };

  const gerarBoleto=async()=>{
    if(!bolSel) return toast("Selecione um cliente","error");
    if(!bolVal||+bolVal<=0) return toast("Informe um valor válido","error");
    setBolLoad(true);
    try {
      if (bolBank === "mercadopago") {
        const r=await api("/api/mercado-pago/admin-gerar-cobranca",{method:"POST",body:JSON.stringify({clienteId:bolSel.id,mes:new Date().getMonth()+1,ano:new Date().getFullYear(),valor:+bolVal,metodo:"bolbradesco"})});
        const d=await r.json();
        if(!r.ok) return toast(d.error||"Erro ao gerar boleto","error");
        setBolRes({ tipo:"mp", pagamento:d.pagamento, cliente:bolSel.nome, valor:bolVal });
      } else {
        const r=await api("/api/boleto/direto",{method:"POST",body:JSON.stringify({clienteId:bolSel.id,valor:+bolVal,banco:bolBank,agencia:bolAgen,agenciaDigito:"",conta:bolCont,contaDigito:"",carteira:bolCart,vencimento:bolVenc,multa:+bolMulta,mora:+bolMora})});
        const d=await r.json();
        if(!r.ok) return toast(d.error||"Erro ao gerar boleto","error");
        setBolRes({ tipo:"direto", boleto:d.boleto, cliente:bolSel.nome, valor:bolVal });
      }
      toast("Boleto gerado com sucesso!","success");
    } catch(e) { toast("Erro ao gerar boleto","error"); }
    finally { setBolLoad(false); }
  };

  // Categoria breakdown
  const cats: Record<string, number> = {};
  trans.filter((t:any)=>t.tipo==="saida").forEach((t:any)=>{ cats[t.categoria]=(cats[t.categoria]||0)+t.valor; });
  const catList=Object.entries(cats).sort((a:any,b:any)=>b[1]-a[1]).slice(0,5);
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
          <button onClick={()=>setShowDre(!showDre)} style={{background:showDre?C.indigoDim:"transparent",color:showDre?C.indigo:C.muted,border:`1px solid ${showDre?C.indigoBorder:C.border}`}} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold hover:border-white/20 transition-colors"><Activity size={13}/>DRE</button>
          <button onClick={()=>{setShowBol(!showBol);if(!showBol){loadCli();setBolRes(null);setBolSel(null);setBolVal("");}}} style={{background:showBol?C.cyanDim:"transparent",color:showBol?C.cyan:C.muted,border:`1px solid ${showBol?C.cyan+"40":C.border}`}} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold hover:border-white/20 transition-colors"><FileText size={13}/>Boleto</button>
          <button onClick={()=>setShowAdd(!showAdd)} style={{background:`linear-gradient(135deg,${C.indigo},${C.purple})`,color:"white",boxShadow:`0 0 20px ${C.indigo}30`}} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold hover:opacity-90"><Plus size={15}/>Nova Transação</button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-4 gap-4">
        {[["Entradas",fmt(ent),C.green,TrendingUp,"from-emerald-700 to-teal-900"] as const,["Saídas",fmt(sai),C.red,TrendingDown,"from-rose-700 to-red-900"] as const,["Saldo",fmt(ent-sai),ent-sai>=0?C.green:C.red,Wallet,ent-sai>=0?"from-emerald-700 to-teal-900":"from-rose-700 to-red-900"] as const,["Transações",fmtN(total),C.indigo,Activity,"from-indigo-700 to-violet-900"] as const].map(([l,v,c,Icon,grad]:any)=>(
          <div key={l} style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl p-5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mb-3`}><Icon size={16} color="white"/></div>
            <div style={{color:C.text,fontFamily:"monospace"}} className="text-xl font-extrabold tabular-nums">{v}</div>
            <div style={{color:C.muted}} className="text-xs mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {/* DRE */}
      {showDre && (
        <div style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl p-5 space-y-4">
          <div style={{color:C.text}} className="font-bold text-sm flex items-center gap-2"><Activity size={15}/>Demonstrativo de Resultado — {MESES[mes]} de {ano}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div style={{color:C.green}} className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2"><TrendingUp size={13}/>Receitas</div>
              {(()=>{
                const cats: Record<string,number>={};
                trans.filter((t:any)=>t.tipo==="entrada").forEach((t:any)=>{ cats[t.categoria]=(cats[t.categoria]||0)+t.valor; });
                return Object.entries(cats).length===0
                  ? <p style={{color:C.muted}} className="text-xs py-2">Nenhuma receita neste mês</p>
                  : Object.entries(cats).sort((a:any,b:any)=>b[1]-a[1]).map(([cat,val]:any)=>(
                      <div key={cat} className="flex items-center justify-between py-1.5 border-b" style={{borderColor:C.border}}>
                        <span style={{color:C.sub}} className="text-xs">{cat}</span>
                        <span style={{color:C.green,fontFamily:"monospace"}} className="text-xs font-bold">{fmt(val)}</span>
                      </div>
                    ));
              })()}
              {trans.some((t:any)=>t.tipo==="entrada")&&<div className="flex items-center justify-between pt-2"><span style={{color:C.text}} className="text-xs font-bold">Total Receitas</span><span style={{color:C.green,fontFamily:"monospace"}} className="text-sm font-extrabold">{fmt(ent)}</span></div>}
            </div>
            <div className="space-y-2">
              <div style={{color:C.red}} className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2"><TrendingDown size={13}/>Despesas</div>
              {(()=>{
                const cats: Record<string,number>={};
                trans.filter((t:any)=>t.tipo==="saida").forEach((t:any)=>{ cats[t.categoria]=(cats[t.categoria]||0)+t.valor; });
                return Object.entries(cats).length===0
                  ? <p style={{color:C.muted}} className="text-xs py-2">Nenhuma despesa neste mês</p>
                  : Object.entries(cats).sort((a:any,b:any)=>b[1]-a[1]).map(([cat,val]:any)=>(
                      <div key={cat} className="flex items-center justify-between py-1.5 border-b" style={{borderColor:C.border}}>
                        <span style={{color:C.sub}} className="text-xs">{cat}</span>
                        <span style={{color:C.red,fontFamily:"monospace"}} className="text-xs font-bold">{fmt(val)}</span>
                      </div>
                    ));
              })()}
              {trans.some((t:any)=>t.tipo==="saida")&&<div className="flex items-center justify-between pt-2"><span style={{color:C.text}} className="text-xs font-bold">Total Despesas</span><span style={{color:C.red,fontFamily:"monospace"}} className="text-sm font-extrabold">{fmt(sai)}</span></div>}
            </div>
          </div>
          <div style={{borderTop:`1px solid ${C.border}`}} className="pt-3 flex items-center justify-between">
            <span style={{color:C.text}} className="text-sm font-bold">Resultado Líquido</span>
            <span style={{color:ent-sai>=0?C.green:C.red,fontFamily:"monospace"}} className="text-lg font-extrabold">{ent-sai>=0?"+":""}{fmt(ent-sai)}</span>
          </div>
        </div>
      )}

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

      {/* Gerar Boleto */}
      {showBol&&(
        <div style={{background:C.card,border:`1px solid ${C.cyan+"40"}`}} className="rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div style={{color:C.cyan}} className="font-bold text-sm flex items-center gap-2"><FileText size={15}/>Gerar Boleto</div>
            <div className="flex items-center gap-2">
              <button onClick={()=>{setShowBankConfig(!showBankConfig);if(!showBankConfig)loadBankConfig();}} style={{color:showBankConfig?C.cyan:C.muted,background:showBankConfig?C.cyanDim:"transparent",border:`1px solid ${showBankConfig?C.cyan+"40":C.border}`}} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] hover:border-white/20 transition-colors"><Settings size={12}/>Config</button>
              <button onClick={()=>setShowBol(false)} style={{color:C.muted}}><X size={16}/></button>
            </div>
          </div>
          {showBankConfig && (
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16}} className="p-4 space-y-4">
              <div style={{color:C.sub}} className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2"><Settings size={12}/>Configuração Bancária — Dados da Empresa</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">Razão Social</label><input value={bankConfig.razao||""} onChange={e=>setBankConfig({...bankConfig,razao:e.target.value,nome:e.target.value})} placeholder="Empresa Ltda" style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:10,padding:"7px 10px",fontSize:12,outline:"none"}}/></div>
                <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">CNPJ</label><input value={bankConfig.cnpj||""} onChange={e=>setBankConfig({...bankConfig,cnpj:e.target.value})} placeholder="00.000.000/0001-00" style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:10,padding:"7px 10px",fontSize:12,outline:"none"}}/></div>
                <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">CEP</label><input value={bankConfig.cep||""} onChange={e=>setBankConfig({...bankConfig,cep:e.target.value})} placeholder="00000-000" style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:10,padding:"7px 10px",fontSize:12,outline:"none"}}/></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2"><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">Endereço</label><input value={bankConfig.endereco||""} onChange={e=>setBankConfig({...bankConfig,endereco:e.target.value})} placeholder="Rua Exemplo, 123" style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:10,padding:"7px 10px",fontSize:12,outline:"none"}}/></div>
                <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">Bairro</label><input value={bankConfig.bairro||""} onChange={e=>setBankConfig({...bankConfig,bairro:e.target.value})} placeholder="Centro" style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:10,padding:"7px 10px",fontSize:12,outline:"none"}}/></div>
                <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">CEP</label><input value={bankConfig.cep||""} onChange={e=>setBankConfig({...bankConfig,cep:e.target.value})} placeholder="00000-000" style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:10,padding:"7px 10px",fontSize:12,outline:"none"}}/></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">Cidade</label><input value={bankConfig.cidade||""} onChange={e=>setBankConfig({...bankConfig,cidade:e.target.value})} placeholder="São Paulo" style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:10,padding:"7px 10px",fontSize:12,outline:"none"}}/></div>
                <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">UF</label><input value={bankConfig.uf||""} onChange={e=>setBankConfig({...bankConfig,uf:e.target.value})} placeholder="SP" maxLength={2} style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:10,padding:"7px 10px",fontSize:12,outline:"none"}}/></div>
              </div>
              <div style={{borderTop:`1px solid ${C.border}`}} className="pt-4 space-y-3">
                <div style={{color:C.sub}} className="text-[11px] font-bold uppercase tracking-wider">Dados por Banco</div>
                {BANCOS.filter(b=>b.id!=="mercadopago").map(b=>{
                  const cfg = bankConfig[b.id]||{};
                  return <div key={b.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12}} className="p-3">
                    <div style={{color:C.cyan}} className="text-xs font-bold mb-2">{b.label}</div>
                    <div className="grid grid-cols-4 gap-2">
                      <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">Agência</label><input value={cfg.agencia||""} onChange={e=>setBankConfig({...bankConfig,[b.id]:{...cfg,agencia:e.target.value}})} placeholder="0000" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:8,padding:"6px 8px",fontSize:11,outline:"none"}}/></div>
                      <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">Dígito Ag.</label><input value={cfg.agenciaDigito||""} onChange={e=>setBankConfig({...bankConfig,[b.id]:{...cfg,agenciaDigito:e.target.value}})} placeholder="0" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:8,padding:"6px 8px",fontSize:11,outline:"none"}}/></div>
                      <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">Conta</label><input value={cfg.conta||""} onChange={e=>setBankConfig({...bankConfig,[b.id]:{...cfg,conta:e.target.value}})} placeholder="00000" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:8,padding:"6px 8px",fontSize:11,outline:"none"}}/></div>
                      <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">Dígito Cta.</label><input value={cfg.contaDigito||""} onChange={e=>setBankConfig({...bankConfig,[b.id]:{...cfg,contaDigito:e.target.value}})} placeholder="0" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:8,padding:"6px 8px",fontSize:11,outline:"none"}}/></div>
                      <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">Carteira</label><input value={cfg.carteira||""} onChange={e=>setBankConfig({...bankConfig,[b.id]:{...cfg,carteira:e.target.value}})} placeholder="09" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:8,padding:"6px 8px",fontSize:11,outline:"none"}}/></div>
                      <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">Convênio</label><input value={cfg.convenio||""} onChange={e=>setBankConfig({...bankConfig,[b.id]:{...cfg,convenio:e.target.value}})} placeholder="000000" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:8,padding:"6px 8px",fontSize:11,outline:"none"}}/></div>
                      <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">Variação</label><input value={cfg.variacao||""} onChange={e=>setBankConfig({...bankConfig,[b.id]:{...cfg,variacao:e.target.value}})} placeholder="019" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:8,padding:"6px 8px",fontSize:11,outline:"none"}}/></div>
                      <div><label style={{color:C.muted}} className="text-[10px] block font-bold mb-1">Nº Documento</label><input value={cfg.numeroDocumento||""} onChange={e=>setBankConfig({...bankConfig,[b.id]:{...cfg,numeroDocumento:e.target.value}})} placeholder="000001" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:8,padding:"6px 8px",fontSize:11,outline:"none"}}/></div>
                    </div>
                  </div>;
                })}
              </div>
              <button onClick={saveBankConfig} disabled={bankConfigLoad} style={{background:bankConfigLoad?C.muted:`linear-gradient(135deg,${C.cyan},${C.indigo})`,color:"white",width:"100%",opacity:bankConfigLoad?0.5:1}} className="py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                {bankConfigLoad?<RefreshCw size={13} className="animate-spin"/>:<Save size={13}/>}Salvar Configuração Bancária
              </button>
            </div>
          )}
          {!bolRes ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Cliente</label>
                <div style={{position:"relative"}}>
                  <Search size={13} style={{color:C.muted,position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
                  <input value={bolSearch} onChange={e=>{setBolSearch(e.target.value);setBolSel(null);}} placeholder="Buscar cliente..." style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px 8px 30px",fontSize:13,outline:"none"}}/>
                </div>
                {bolSearch&&!bolSel&&(
                  <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,marginTop:4,maxHeight:180,overflowY:"auto",position:"absolute",zIndex:10,width:"calc(100% - 12px)"}}>
                    {bolCli.filter(c=>c.nome?.toLowerCase().includes(bolSearch.toLowerCase())).slice(0,10).map(c=>(
                      <div key={c.id} onClick={()=>{setBolSel(c);setBolVal(c.valor||"");}} style={{color:C.text,borderBottom:`1px solid ${C.border}`,cursor:"pointer"}} className="px-3 py-2 text-xs hover:bg-white/[0.03] flex items-center gap-2">
                        <div style={{background:C.indigoDim,color:C.indigo}} className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold">{c.nome?.slice(0,2).toUpperCase()}</div>
                        <span className="flex-1">{c.nome}</span>
                        <span style={{color:C.muted,fontSize:10}}>{fmt(c.valor||0)}/mês</span>
                      </div>
                    ))}
                    {bolCli.filter(c=>c.nome?.toLowerCase().includes(bolSearch.toLowerCase())).length===0&&<div style={{color:C.muted}} className="px-3 py-4 text-xs text-center">Nenhum cliente encontrado</div>}
                  </div>
                )}
                {bolSel&&<div style={{background:C.cyanDim,border:`1px solid ${C.cyan+"30"}`,borderRadius:10,padding:"8px 12px",marginTop:4}} className="flex items-center gap-2 text-xs"><CheckCircle size={12} style={{color:C.cyan}}/><span style={{color:C.text}}>{bolSel.nome}</span><span style={{color:C.muted}}>— {fmt(bolSel.valor||0)}/mês</span><button onClick={()=>{setBolSel(null);setBolSearch("");}} style={{color:C.muted,marginLeft:"auto"}}><X size={12}/></button></div>}
              </div>
              <div>
                <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Banco</label>
                <select value={bolBank} onChange={e=>setBolBank(e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:13,outline:"none"}}>
                  {BANCOS.map(b=><option key={b.id} value={b.id}>{b.configured?"✓ ":""}{b.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Valor (R$)</label>
                <input type="number" min="0" step="0.01" value={bolVal} onChange={e=>setBolVal(e.target.value)} placeholder="0,00" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:14,outline:"none",fontWeight:"bold",fontFamily:"monospace"}}/>
              </div>
              <div>
                <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Vencimento</label>
                <input type="date" value={bolVenc} onChange={e=>setBolVenc(e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:13,outline:"none"}}/>
              </div>
              {bolBank !== "mercadopago" && (
                <>
                  <div>
                    <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Multa (%)</label>
                    <input type="number" min="0" step="0.01" value={bolMulta} onChange={e=>setBolMulta(e.target.value)} placeholder="2" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:13,outline:"none"}}/>
                  </div>
                  <div>
                    <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Mora (R$/dia)</label>
                    <input type="number" min="0" step="0.01" value={bolMora} onChange={e=>setBolMora(e.target.value)} placeholder="1,59" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:13,outline:"none"}}/>
                  </div>
                  <div>
                    <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Agência</label>
                    <input value={bolAgen} onChange={e=>setBolAgen(e.target.value)} placeholder="0000" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:13,outline:"none"}}/>
                  </div>
                  <div>
                    <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Conta</label>
                    <input value={bolCont} onChange={e=>setBolCont(e.target.value)} placeholder="00000" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:13,outline:"none"}}/>
                  </div>
                  <div>
                    <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Carteira</label>
                    <input value={bolCart} onChange={e=>setBolCart(e.target.value)} placeholder="09" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:13,outline:"none"}}/>
                  </div>
                  <div className="flex items-end">
                    <button onClick={gerarBoleto} disabled={bolLoad||!bolSel} style={{background:bolLoad?C.muted:`linear-gradient(135deg,${C.cyan},${C.indigo})`,color:"white",width:"100%",opacity:bolSel&&!bolLoad?1:0.5}} className="py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                      {bolLoad?<RefreshCw size={14} className="animate-spin"/>:<FileText size={14}/>}{bolLoad?"Gerando...":"Gerar Boleto"}
                    </button>
                  </div>
                </>
              )}
              {bolBank === "mercadopago" && (
                <div className="flex items-end">
                  <button onClick={gerarBoleto} disabled={bolLoad||!bolSel} style={{background:bolLoad?C.muted:`linear-gradient(135deg,${C.cyan},${C.indigo})`,color:"white",width:"100%",opacity:bolSel&&!bolLoad?1:0.5}} className="py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                    {bolLoad?<RefreshCw size={14} className="animate-spin"/>:<FileText size={14}/>}{bolLoad?"Gerando...":"Gerar Boleto"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{background:C.greenDim,border:`1px solid ${C.green+"30"}`,borderRadius:16,padding:20}} className="text-center space-y-3">
              <div style={{background:C.greenDim}} className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"><CheckCircle size={24} style={{color:C.green}}/></div>
              <div style={{color:C.text}} className="font-bold text-sm">Boleto gerado!</div>
              <div style={{color:C.sub}} className="text-xs">Cliente: {bolRes?.cliente} — Valor: {fmt(+bolRes?.valor)}</div>
              {bolRes?.tipo === "mp" ? (
                <a href={bolRes.pagamento?.linkPagamento} target="_blank" rel="noopener noreferrer" style={{background:`linear-gradient(135deg,${C.cyan},${C.indigo})`,color:"white"}} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold hover:opacity-90 transition-opacity"><ExternalLink size={15}/>Visualizar Boleto MP</a>
              ) : (
                <a href={bolRes.boleto?.url} target="_blank" rel="noopener noreferrer" style={{background:`linear-gradient(135deg,${C.cyan},${C.indigo})`,color:"white"}} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold hover:opacity-90 transition-opacity"><ExternalLink size={15}/>Baixar PDF</a>
              )}
              <div className="flex gap-2 justify-center">
                <button onClick={()=>setBolRes(null)} style={{border:`1px solid ${C.border}`,color:C.muted}} className="px-4 py-2 rounded-xl text-xs hover:border-white/20">Gerar outro</button>
                <button onClick={()=>setShowBol(false)} style={{border:`1px solid ${C.border}`,color:C.muted}} className="px-4 py-2 rounded-xl text-xs hover:border-white/20">Fechar</button>
              </div>
            </div>
          )}
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
            {["Tipo","Categoria","Descrição","Valor","Data","Status",""].map(h=><th key={h} style={{color:C.muted,padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em"}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {trans.map((t,i)=>(
              <tr key={t.id} style={{borderBottom:i<trans.length-1?`1px solid ${C.border}`:"none"}} className="hover:bg-white/[0.015] transition-colors">
                <td style={{padding:"10px 14px"}}><span style={{color:t.tipo==="entrada"?C.green:C.red,background:`${t.tipo==="entrada"?C.green:C.red}18`,border:`1px solid ${t.tipo==="entrada"?"rgba(34,197,94,0.3)":"rgba(244,63,94,0.3)"}`,fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:6,display:"inline-flex",alignItems:"center",gap:4}}><span>{t.tipo==="entrada"?"↑":"↓"}</span>{t.tipo==="entrada"?"Entrada":"Saída"}</span></td>
                <td style={{padding:"10px 14px",color:C.sub,fontSize:12}}>{t.categoria}</td>
                <td style={{padding:"10px 14px",color:C.text,fontSize:13}}>{t.descricao}</td>
                <td style={{padding:"10px 14px"}}><span style={{color:t.tipo==="entrada"?C.green:C.red,fontFamily:"monospace",fontWeight:800,fontSize:13}}>{t.tipo==="entrada"?"+":"-"}{fmt(t.valor)}</span></td>
                <td style={{padding:"10px 14px",color:C.muted,fontSize:12}}>{t.data}</td>
                <td style={{padding:"10px 14px"}}>
                  {t.status==="pendente"?<span style={{color:C.amber,background:C.amberDim,border:`1px solid ${C.amber+"30"}`,fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:4}}>PENDENTE</span>
                  :t.status==="pago"?<span style={{color:C.green,background:C.greenDim,border:`1px solid ${C.green+"30"}`,fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:4}}>PAGO</span>
                  :<span style={{color:C.muted,fontSize:9}}>—</span>}
                </td>
                <td style={{padding:"10px 14px"}}>
                  <div className="flex items-center gap-1">
                    {t.status==="pendente"&&t.tipo==="entrada"&&<button onClick={async()=>{await api(`/api/transacoes/${t.id}`,{method:"PUT",body:JSON.stringify({status:"pago"})});toast("Receita recebida!","success");load();reload();}} style={{color:C.green,background:C.greenDim}} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-green-500/20 transition-colors" title="Receber"><DollarSign size={12}/></button>}
                    <button onClick={()=>del(t.id)} style={{color:C.red,background:C.redDim}} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-colors"><Trash2 size={12}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {trans.length===0&&<div className="py-12 text-center"><DollarSign size={32} style={{color:C.muted}} className="mx-auto mb-2 opacity-30"/><p style={{color:C.muted}} className="text-sm">Nenhuma transação encontrada</p></div>}
      </div>
    </div>
  );
}
