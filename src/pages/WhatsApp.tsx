import { useState, useEffect, useRef } from "react";
import { C, fmt, socket } from "../constants.js";
import { MessageSquare, Send, Plus, Trash2, Edit, Play, Pause, X, RefreshCw, CheckCheck, Check, Clock, XCircle, Users, Zap, FileText, Save, Wifi, WifiOff, QrCode, AlertTriangle, ChevronRight } from "lucide-react";

const MsgIcon=({s,size=12})=>{
  if(s==="read")      return <CheckCheck size={size} style={{color:C.green}}/>;
  if(s==="delivered") return <CheckCheck size={size} style={{color:"#94a3b8"}}/>;
  if(s==="sent")      return <Check      size={size} style={{color:C.muted}}/>;
  if(s==="sending")   return <RefreshCw  size={size} className="animate-spin" style={{color:C.amber}}/>;
  if(s==="failed")    return <XCircle    size={size} style={{color:C.red}}/>;
  return <Clock size={size} style={{color:C.muted}}/>;
};

export default function WhatsApp({ toast, api, waStatus }) {
  const [tab,      setTab]      = useState("status");
  const [qr,       setQr]       = useState<any>(null);
  const [queue,    setQueue]    = useState<any[]>([]);
  const [mensagens,setMensagens]= useState<any[]>([]);
  const [templates,setTemplates]= useState<any[]>([]);
  const [campanhas,setCampanhas]= useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [showSend, setShowSend] = useState(false);
  const [showCamp, setShowCamp] = useState(false);
  const [showTmpl, setShowTmpl] = useState(false);
  const [sendForm, setSendForm] = useState({telefone:"",mensagem:""});

  // Sound notification on new message
  useEffect(() => {
    const handler = (msg: any) => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.08;
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
        setTimeout(() => {
          const o2 = ctx.createOscillator();
          const g2 = ctx.createGain();
          o2.connect(g2);
          g2.connect(ctx.destination);
          o2.frequency.value = 1320;
          g2.gain.value = 0.06;
          o2.start(ctx.currentTime);
          o2.stop(ctx.currentTime + 0.1);
        }, 150);
      } catch {}
    };
    socket.on("wa_mensagem_recebida", handler);
    return () => { socket.off("wa_mensagem_recebida", handler); };
  }, []);
  const [campForm, setCampForm] = useState({nome:"",mensagem:"",grupo:"atrasados"});
  const [tmplForm, setTmplForm] = useState({nome:"",categoria:"cobranca",conteudo:""});
  const [editTmpl, setEditTmpl] = useState<any>(null);

  useEffect(()=>{
    loadData();
    api("/api/wa/status").then(r=>r.json()).then(d=>{ if(d.qr) setQr(d.qr); }).catch(()=>{});
    socket.on("wa_qr", q=>setQr(q));
    socket.on("wa_status", d=>{ if(d.status!=="qr") setQr(null); });
    socket.on("wa_queue_add", item=>setQueue(q=>[item,...q]));
    socket.on("wa_queue_update", upd=>setQueue(q=>q.map(m=>m.id===upd.id?{...m,...upd}:m)));
    socket.on("wa_mensagem_recebida", msg=>setMensagens(ms=>[msg,...ms]));
    return ()=>{ socket.off("wa_qr"); socket.off("wa_status"); socket.off("wa_queue_add"); socket.off("wa_queue_update"); socket.off("wa_mensagem_recebida"); };
  },[]);

  const loadData=async()=>{
    const [q,m,t,c,cl]=await Promise.all([
      api("/api/wa/queue").then(r=>r.json()),
      api("/api/wa/mensagens").then(r=>r.json()),
      api("/api/wa/templates").then(r=>r.json()),
      api("/api/wa/campanhas").then(r=>r.json()),
      api("/api/clientes?status=ativo").then(r=>r.json()),
    ]);
    setQueue(q.items||[]); setMensagens(m); setTemplates(t); setCampanhas(c); setClientes(cl);
  };

  const initWA = async()=>{ await api("/api/wa/init",{method:"POST"}); toast("Iniciando WhatsApp...","info"); };
  const logoutWA=async()=>{ if(!confirm("Desconectar WhatsApp?")) return; await api("/api/wa/logout",{method:"POST"}); toast("WhatsApp desconectado","info"); setQr(null); };

  const sendMsg=async()=>{
    if(!sendForm.telefone||!sendForm.mensagem) return toast("Preencha telefone e mensagem","error");
    await api("/api/wa/send",{method:"POST",body:JSON.stringify(sendForm)});
    toast("Mensagem adicionada à fila!","success"); setShowSend(false); setSendForm({telefone:"",mensagem:""});
  };

  const sendCamp=async()=>{
    const contatos = campForm.grupo==="atrasados" ? clientes.filter(c=>c._situacao==="atrasado") : campForm.grupo==="vencendo"?clientes.filter(c=>c._situacao==="vencendo"):clientes;
    if(contatos.length===0) return toast("Nenhum contato no grupo selecionado","error");
    await api("/api/wa/campanha",{method:"POST",body:JSON.stringify({...campForm,contatos:contatos.map(c=>({telefone:c.telefone,nome:c.nome,valor:fmt(c.valor),dataVencimento:c.dataVencimento}))})});
    toast(`Campanha iniciada! ${contatos.length} mensagens na fila.`,"success"); setShowCamp(false); loadData();
  };

  const saveTmpl=async()=>{
    if(!tmplForm.nome||!tmplForm.conteudo) return toast("Preencha nome e conteúdo","error");
    if(editTmpl?.id) await api(`/api/wa/templates/${editTmpl.id}`,{method:"PUT",body:JSON.stringify(tmplForm)});
    else await api("/api/wa/templates",{method:"POST",body:JSON.stringify(tmplForm)});
    toast("Template salvo!","success"); setShowTmpl(false); setEditTmpl(null); setTmplForm({nome:"",categoria:"cobranca",conteudo:""});
    api("/api/wa/templates").then(r=>r.json()).then(setTemplates);
  };

  const delTmpl=async id=>{ await api(`/api/wa/templates/${id}`,{method:"DELETE"}); api("/api/wa/templates").then(r=>r.json()).then(setTemplates); };

  const useTemplate=(t)=>{ setSendForm(f=>({...f,mensagem:t.conteudo})); setShowSend(true); };

  const TABS=[["status","Status WA"],["enviar","Enviar"],["fila","Fila"],["campanhas","Campanhas"],["templates","Templates"],["mensagens","Histórico"]];

  const StatusColor={connected:C.green,qr:C.amber,connecting:C.cyan,disconnected:C.red,not_installed:C.muted};
  const StatusLabel={connected:"Conectado",qr:"Aguardando QR",connecting:"Conectando...",disconnected:"Desconectado",not_installed:"Não instalado"};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div style={{color:C.text}} className="font-bold text-lg">WhatsApp Business</div>
        <div className="flex items-center gap-2">
          <div style={{background:`${StatusColor[waStatus]||C.muted}15`,border:`1px solid ${StatusColor[waStatus]||C.muted}35`,color:StatusColor[waStatus]||C.muted}} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-current animate-pulse"/>
            {StatusLabel[waStatus]||waStatus}
          </div>
          {waStatus==="connected"&&<button onClick={logoutWA} style={{border:`1px solid rgba(244,63,94,0.3)`,color:C.red}} className="px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500/10 transition-colors">Desconectar</button>}
          {(waStatus==="disconnected"||waStatus==="not_installed")&&<button onClick={initWA} style={{background:`linear-gradient(135deg,${C.green},#16a34a)`,color:"white"}} className="px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90">Conectar</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl p-1 flex gap-1">
        {TABS.map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:tab===k?C.indigoDim:"transparent",color:tab===k?C.indigo:C.muted,border:`1px solid ${tab===k?C.indigoBorder:"transparent"}`}} className="flex-1 py-2 rounded-xl text-xs font-bold transition-all">{l}</button>
        ))}
      </div>

      {/* Status */}
      {tab==="status"&&(
        <div className="grid grid-cols-2 gap-5">
          <div style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl p-6">
            <div style={{color:C.text}} className="font-bold text-sm mb-4">Conexão WhatsApp</div>
            {waStatus==="qr"&&qr ? (
              <div className="flex flex-col items-center gap-4">
                <div style={{background:"white",padding:16,borderRadius:16,width:220,height:220,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 40px ${C.green}25`}}>
                  <img src={qr} alt="QR Code" style={{width:188,height:188}}/>
                </div>
                <div style={{background:C.greenDim,border:"1px solid rgba(34,197,94,0.2)"}} className="rounded-xl p-4 w-full space-y-2">
                  {["Abra o WhatsApp no celular","Toque em ⋮ → Aparelhos conectados","Toque em Conectar um aparelho","Escaneie o QR Code acima"].map((s,i)=>(
                    <div key={i} className="flex items-center gap-2">
                      <span style={{background:C.green,color:"white"}} className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i+1}</span>
                      <span style={{color:C.sub}} className="text-xs">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : waStatus==="connected" ? (
              <div style={{background:C.greenDim,border:"1px solid rgba(34,197,94,0.2)"}} className="rounded-xl p-5 text-center">
                <div className="w-14 h-14 rounded-full" style={{background:C.green,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Wifi size={24} color="white"/></div>
                <div style={{color:C.green}} className="font-bold text-lg">WhatsApp Conectado!</div>
                <div style={{color:C.muted}} className="text-xs mt-1">Pronto para enviar e receber mensagens</div>
              </div>
            ) : waStatus==="not_installed" ? (
              <div style={{background:C.amberDim,border:"1px solid rgba(245,158,11,0.2)"}} className="rounded-xl p-5">
                <AlertTriangle size={24} style={{color:C.amber}} className="mb-3"/>
                <div style={{color:C.amber}} className="font-bold text-sm mb-2">Baileys não instalado</div>
                <div style={{color:C.muted}} className="text-xs mb-3">Para envio real de WhatsApp, instale a dependência:</div>
                <code style={{background:"rgba(0,0,0,0.4)",color:C.cyan,borderRadius:8,padding:"8px 12px",fontSize:11,display:"block"}}>npm install @whiskeysockets/baileys</code>
                <div style={{color:C.muted}} className="text-xs mt-3">Sem a lib, o sistema funciona em modo simulação.</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-8">
                <WifiOff size={40} style={{color:C.muted}} className="opacity-40"/>
                <p style={{color:C.muted}} className="text-sm">Clique em "Conectar" para iniciar</p>
              </div>
            )}
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl p-6">
            <div style={{color:C.text}} className="font-bold text-sm mb-4">Estatísticas</div>
            <div className="space-y-3">
              {[[queue.length,"Na fila",C.amber],[mensagens.filter(m=>m.tipo==="enviada").length,"Enviadas",C.green],[mensagens.filter(m=>m.tipo==="recebida").length,"Recebidas",C.cyan],[campanhas.length,"Campanhas",C.purple]].map(([v,l,c])=>(
                <div key={l} style={{background:C.card2,border:`1px solid ${C.border}`}} className="rounded-xl p-3 flex items-center justify-between">
                  <span style={{color:C.sub}} className="text-sm">{l}</span>
                  <span style={{color: c as any, fontFamily:"monospace" as any}} className="font-extrabold text-lg">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enviar */}
      {tab==="enviar"&&(
        <div className="grid grid-cols-2 gap-5">
          <div style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl p-5 space-y-4">
            <div style={{color:C.text}} className="font-bold text-sm">Enviar Mensagem Individual</div>
            {([["Telefone",sendForm.telefone,(v:string)=>setSendForm({...sendForm,telefone:v}),"11999999999"],] as const).map(([l,v,set,ph]:any)=>(
              <div key={l as string}>
                <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">{l as string}</label>
                <input value={v as string} onChange={e=>(set as any)(e.target.value)} placeholder={ph as string} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"10px 14px",fontSize:13,outline:"none"}}/>
              </div>
            ))}
            <div>
              <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Mensagem</label>
              <textarea value={sendForm.mensagem} onChange={e=>setSendForm({...sendForm,mensagem:e.target.value})} rows={5} placeholder="Digite sua mensagem..." style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"10px 14px",fontSize:13,outline:"none",resize:"none"}}/>
            </div>
            <button onClick={sendMsg} disabled={waStatus!=="connected"} style={{background:waStatus==="connected"?`linear-gradient(135deg,${C.green},#16a34a)`:"rgba(255,255,255,0.05)",color:waStatus==="connected"?"white":C.muted,opacity:waStatus==="connected"?1:0.5}} className="w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-90">
              <Send size={15}/> Enviar Mensagem
            </button>
            {/* Preview */}
            {sendForm.mensagem&&(
              <div style={{background:"#0b1e14",borderRadius:12,padding:16}}>
                <div style={{color:"#25d366"}} className="text-[11px] mb-2">Preview</div>
                <div style={{background:"#1f5c3a",borderRadius:"12px 12px 12px 2px",padding:"8px 12px",display:"inline-block",maxWidth:"90%"}}>
                  <p style={{color:"white"}} className="text-sm whitespace-pre-wrap">{sendForm.mensagem}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span style={{color:"rgba(144,229,182,0.6)"}} className="text-[9px]">{new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span>
                    <CheckCheck size={11} style={{color:"#60a5fa"}}/>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl p-5 space-y-4">
            <div style={{color:C.text}} className="font-bold text-sm">Campanha em Massa</div>
            <div>
              <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Nome da Campanha</label>
              <input value={campForm.nome} onChange={e=>setCampForm({...campForm,nome:e.target.value})} placeholder="Ex: Cobrança Junho/2025" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"10px 14px",fontSize:13,outline:"none"}}/>
            </div>
            <div>
              <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Grupo de Destino</label>
              <div className="grid grid-cols-3 gap-2">
                {[["atrasados","Inadimplentes",C.red],["vencendo","Vencendo",C.amber],["todos","Todos Ativos",C.cyan]].map(([k,l,c])=>(
                  <button key={k} onClick={()=>setCampForm({...campForm,grupo:k})} style={{background:campForm.grupo===k?`${c}15`:"transparent",color:campForm.grupo===k?c:C.muted,border:`1px solid ${campForm.grupo===k?`${c}35`:C.border}`}} className="py-2 rounded-xl text-[11px] font-bold transition-all">
                    {l}<br/><span className="text-[9px] opacity-70">({k==="atrasados"?clientes.filter(c=>c._situacao==="atrasado").length:k==="vencendo"?clientes.filter(c=>c._situacao==="vencendo").length:clientes.length})</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Mensagem (use {"{{nome}} {{valor}} {{vencimento}}"})</label>
              <textarea value={campForm.mensagem} onChange={e=>setCampForm({...campForm,mensagem:e.target.value})} rows={5} placeholder="Olá {{nome}}, sua mensalidade de {{valor}} está em aberto..." style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"10px 14px",fontSize:13,outline:"none",resize:"none"}}/>
            </div>
            <button onClick={sendCamp} disabled={waStatus!=="connected"} style={{background:waStatus==="connected"?`linear-gradient(135deg,${C.indigo},${C.purple})`:"rgba(255,255,255,0.05)",color:waStatus==="connected"?"white":C.muted,opacity:waStatus==="connected"?1:0.5}} className="w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-90">
              <Users size={15}/> Disparar Campanha
            </button>
          </div>
        </div>
      )}

      {/* Fila */}
      {tab==="fila"&&(
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span style={{color:C.text}} className="font-bold text-sm">Fila de Mensagens ({queue.length})</span>
            <div className="flex gap-2">
              <button onClick={()=>api("/api/wa/queue/pause",{method:"POST"})} style={{border:`1px solid ${C.border}`,color:C.muted}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:border-white/20"><Pause size={11}/>Pausar</button>
              <button onClick={()=>api("/api/wa/queue/resume",{method:"POST"})} style={{border:`1px solid ${C.border}`,color:C.muted}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:border-white/20"><Play size={11}/>Retomar</button>
              <button onClick={()=>api("/api/wa/queue",{method:"DELETE"}).then(()=>loadData())} style={{background:C.redDim,border:"1px solid rgba(244,63,94,0.3)",color:C.red}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"><Trash2 size={11}/>Limpar</button>
            </div>
          </div>
          {queue.length===0?<div style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl py-16 text-center"><MessageSquare size={32} style={{color:C.muted}} className="mx-auto mb-2 opacity-30"/><p style={{color:C.muted}} className="text-sm">Fila vazia</p></div>:queue.map((m,i)=>(
            <div key={m.id} style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-xl px-4 py-3 flex items-center gap-3">
              <span style={{color:C.muted,fontFamily:"monospace"}} className="text-xs w-5">{i+1}</span>
              <div className="flex-1 min-w-0">
                <div style={{color:C.text}} className="text-xs font-semibold">{m.telefone}</div>
                <div style={{color:C.muted}} className="text-[10px] truncate">{m.mensagem}</div>
              </div>
              <MsgIcon s={m.status}/>
            </div>
          ))}
        </div>
      )}

      {/* Campanhas */}
      {tab==="campanhas"&&(
        <div className="space-y-3">
          {campanhas.length===0?<div style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl py-16 text-center"><Zap size={32} style={{color:C.muted}} className="mx-auto mb-2 opacity-30"/><p style={{color:C.muted}} className="text-sm">Nenhuma campanha criada</p></div>:campanhas.map(c=>(
            <div key={c.id} style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div style={{color:C.text}} className="font-bold text-sm">{c.nome}</div>
                <span style={{background:C.indigoDim,color:C.indigo,border:`1px solid ${C.indigoBorder}`}} className="text-[10px] font-bold px-2 py-0.5 rounded-full">{c.status}</span>
              </div>
              <div className="flex gap-6 text-center">
                {[[c.total,"Total",C.muted],[c.enviados,"Enviados",C.green],[c.falhas,"Falhas",C.red]].map(([v,l,col])=>(
                  <div key={l}><div style={{color:col,fontFamily:"monospace"}} className="font-extrabold text-lg">{v}</div><div style={{color:C.muted}} className="text-[10px]">{l}</div></div>
                ))}
              </div>
              {c.total>0&&<div style={{background:"rgba(255,255,255,0.06)"}} className="h-1.5 rounded-full overflow-hidden mt-3"><div style={{width:`${Math.round(c.enviados/c.total*100)}%`,background:`linear-gradient(90deg,${C.indigo},${C.purple})`}} className="h-full rounded-full transition-all"/></div>}
            </div>
          ))}
        </div>
      )}

      {/* Templates */}
      {tab==="templates"&&(
        <div className="space-y-4">
          <button onClick={()=>setShowTmpl(true)} style={{background:`linear-gradient(135deg,${C.indigo},${C.purple})`,color:"white"}} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold hover:opacity-90"><Plus size={14}/>Novo Template</button>
          {showTmpl&&(
            <div style={{background:C.card,border:`1px solid ${C.indigoBorder}`}} className="rounded-2xl p-5 space-y-4">
              <div style={{color:C.indigo}} className="font-bold text-sm">{editTmpl?"Editar":"Novo"} Template</div>
              <div className="grid grid-cols-2 gap-3">
                {([["Nome",tmplForm.nome,(v:string)=>setTmplForm({...tmplForm,nome:v}),"Cobrança Amigável"],] as const).map(([l,v,set,ph]:any)=>(
                  <div key={l as string}><label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">{l as string}</label><input value={v as string} onChange={e=>(set as any)(e.target.value)} placeholder={ph as string} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:13,outline:"none"}}/></div>
                ))}
                <div>
                  <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Categoria</label>
                  <select value={tmplForm.categoria} onChange={e=>setTmplForm({...tmplForm,categoria:e.target.value})} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:13,outline:"none"}}>
                    {["cobranca","onboarding","lembrete","comercial","satisfacao","outros"].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{color:C.sub}} className="text-xs font-bold mb-1 block uppercase tracking-wider">Conteúdo</label>
                <textarea value={tmplForm.conteudo} onChange={e=>setTmplForm({...tmplForm,conteudo:e.target.value})} rows={4} placeholder="Olá {{nome}}! ..." style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,width:"100%",borderRadius:12,padding:"8px 12px",fontSize:13,outline:"none",resize:"none"}}/>
                <div style={{color:C.muted}} className="text-[10px] mt-1">Variáveis: {"{{nome}} {{valor}} {{vencimento}} {{diasAtraso}}"}</div>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>{setShowTmpl(false);setEditTmpl(null);setTmplForm({nome:"",categoria:"cobranca",conteudo:""}); }} style={{border:`1px solid ${C.border}`,color:C.muted}} className="flex-1 py-2.5 rounded-xl text-sm">Cancelar</button>
                <button onClick={saveTmpl} style={{background:`linear-gradient(135deg,${C.indigo},${C.purple})`,color:"white"}} className="flex-1 py-2.5 rounded-xl text-sm font-extrabold"><Save size={14} className="inline mr-1"/>Salvar</button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {templates.map(t=>(
              <div key={t.id} style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div style={{color:C.text}} className="font-bold text-sm">{t.nome}</div>
                  <span style={{background:C.indigoDim,color:C.indigo,border:`1px solid ${C.indigoBorder}`}} className="text-[9px] font-bold px-2 py-0.5 rounded-full">{t.categoria}</span>
                </div>
                <p style={{color:C.sub}} className="text-xs leading-relaxed mb-3">{t.conteudo}</p>
                <div className="flex gap-2">
                  <button onClick={()=>useTemplate(t)} style={{background:C.greenDim,color:C.green,border:"1px solid rgba(34,197,94,0.3)"}} className="flex-1 py-1.5 rounded-lg text-[11px] font-bold hover:bg-green-500/20 transition-colors">Usar</button>
                  <button onClick={()=>{setEditTmpl(t);setTmplForm({nome:t.nome,categoria:t.categoria,conteudo:t.conteudo});setShowTmpl(true);}} style={{color:C.muted,border:`1px solid ${C.border}`}} className="w-8 h-8 rounded-lg flex items-center justify-center hover:border-white/20 transition-colors"><Edit size={12}/></button>
                  <button onClick={()=>delTmpl(t.id)} style={{color:C.red,background:C.redDim}} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-colors"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      {tab==="mensagens"&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`}} className="rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead><tr style={{background:C.card2,borderBottom:`1px solid ${C.border}`}}>
              {["Tipo","Para/De","Mensagem","Status","Quando"].map(h=><th key={h} style={{color:C.muted,padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {mensagens.map((m,i)=>(
                <tr key={m.id||i} style={{borderBottom:i<mensagens.length-1?`1px solid ${C.border}`:"none"}} className="hover:bg-white/[0.015] transition-colors">
                  <td style={{padding:"10px 14px"}}><span style={{color:m.tipo==="enviada"?C.green:C.cyan,background:`${m.tipo==="enviada"?C.green:C.cyan}18`,border:`1px solid ${m.tipo==="enviada"?"rgba(34,197,94,0.3)":"rgba(6,182,212,0.3)"}`,fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:6}}>{m.tipo==="enviada"?"↑ Enviada":"↓ Recebida"}</span></td>
                  <td style={{padding:"10px 14px",color:C.sub,fontSize:12,fontFamily:"monospace"}}>{m.para||m.de}</td>
                  <td style={{padding:"10px 14px",color:C.text,fontSize:12,maxWidth:300}}><div className="truncate">{m.texto}</div></td>
                  <td style={{padding:"10px 14px"}}><MsgIcon s={m.status||"sent"}/></td>
                  <td style={{padding:"10px 14px",color:C.muted,fontSize:11}}>{m.timestamp?new Date(m.timestamp).toLocaleString("pt-BR"):"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {mensagens.length===0&&<div className="py-12 text-center"><MessageSquare size={28} style={{color:C.muted}} className="mx-auto mb-2 opacity-30"/><p style={{color:C.muted}} className="text-sm">Nenhuma mensagem no histórico</p></div>}
        </div>
      )}
    </div>
  );
}
