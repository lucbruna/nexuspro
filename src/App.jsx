import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CRM from "./pages/CRM.jsx";
import Financeiro from "./pages/Financeiro.jsx";
import WhatsApp from "./pages/WhatsApp.jsx";
import ChatIA from "./pages/ChatIA.jsx";
import Estoque from "./pages/Estoque.jsx";
import RH from "./pages/RH.jsx";
import Email from "./pages/Email.jsx";
import Contabilidade from "./pages/Contabilidade.jsx";
import Advocacia from "./pages/Advocacia.jsx";
import { Kanban, Agenda, Relatorios, Configuracoes } from "./pages/Pages.jsx";
import { Bell, LogOut, AlertTriangle, CheckCircle, X, Info } from "lucide-react";
import { C, socket, fmt, fmtN } from "./constants.js";

export { C, socket, fmt, fmtN };

export function Toast({ msg, type, onClose }) {
  useEffect(()=>{ const t=setTimeout(onClose,4000); return()=>clearTimeout(t); },[]);
  const colors={success:C.green,error:C.red,info:C.cyan,warning:C.amber};
  const c=colors[type]||C.indigo;
  const Icon=type==="success"?CheckCircle:type==="error"?X:type==="warning"?AlertTriangle:Info;
  return (
    <div style={{background:C.card,border:`1px solid ${c}40`,boxShadow:`0 8px 32px ${c}20`,minWidth:300,zIndex:999,position:"fixed",bottom:20,right:20}} className="flex items-center gap-3 px-4 py-3 rounded-xl">
      <Icon size={16} style={{color:c,flexShrink:0}}/>
      <span style={{color:C.text}} className="text-sm flex-1">{msg}</span>
      <button onClick={onClose} style={{color:C.muted}}><X size={13}/></button>
    </div>
  );
}

function AppInner() {
  const { user, logout, token } = useAuth();
  const [page,    setPage]   = useState("dashboard");
  const [stats,   setStats]  = useState(null);
  const [toasts,  setToasts] = useState([]);
  const [notifs,  setNotifs] = useState([]);
  const [showN,   setShowN]  = useState(false);
  const [waStatus,setWaStatus]=useState("disconnected");

  const toast=(msg,type="info")=>setToasts(t=>[...t,{id:Date.now()+Math.random(),msg,type}]);
  const api=(url,opts={})=>fetch(url,{...opts,headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`,...(opts.headers||{})}});
  const loadStats=async()=>{ try{ const s=await api("/api/stats").then(r=>r.json()); setStats(s); }catch(_){} };

  useEffect(()=>{
    if(!user) return;
    loadStats();
    api("/api/notificacoes").then(r=>r.json()).then(n=>setNotifs(n.filter(x=>!x.lida))).catch(()=>{});
    socket.on("stats_update", setStats);
    socket.on("data_update",  loadStats);
    socket.on("wa_status",    d=>setWaStatus(d.status));
    socket.on("alerta",       d=>toast(d.mensagem||"Alerta","warning"));
    return()=>{ socket.off("stats_update"); socket.off("data_update"); socket.off("wa_status"); socket.off("alerta"); };
  },[user]);

  if (!user) return <Login/>;

  const PAGES={
    dashboard:    <Dashboard   stats={stats} reload={loadStats} setPage={setPage} toast={toast} api={api}/>,
    crm:          <CRM         toast={toast} api={api} reload={loadStats}/>,
    financeiro:   <Financeiro  toast={toast} api={api} reload={loadStats}/>,
    whatsapp:     <WhatsApp    toast={toast} api={api} waStatus={waStatus}/>,
    chatia:       <ChatIA      toast={toast} api={api}/>,
    kanban:       <Kanban      toast={toast} api={api}/>,
    estoque:      <Estoque     toast={toast} api={api}/>,
    rh:           <RH          toast={toast} api={api}/>,
    email:        <Email       toast={toast} api={api}/>,
    contabilidade:<Contabilidade toast={toast} api={api}/>,
    advocacia:    <Advocacia    toast={toast} api={api}/>,
    agenda:       <Agenda      toast={toast} api={api}/>,
    relatorios:   <Relatorios  toast={toast} api={api}/>,
    configuracoes:<Configuracoes toast={toast} api={api} reload={loadStats}/>,
  };

  const pageLabel={dashboard:"Dashboard",crm:"CRM — Clientes",financeiro:"Financeiro",whatsapp:"WhatsApp",chatia:"Chat com IA",kanban:"Pipeline Kanban",estoque:"Estoque",rh:"RH & Pessoal",email:"E-mail",contabilidade:"Contabilidade",advocacia:"Advocacia",agenda:"Agenda",relatorios:"Relatórios",configuracoes:"Configurações"};

  return (
    <div style={{background:C.bg,color:C.text,fontFamily:"'DM Sans',sans-serif"}} className="flex h-screen overflow-hidden">
      <Sidebar page={page} setPage={setPage} stats={stats} waStatus={waStatus}/>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header style={{background:`${C.surface}e0`,backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`}} className="h-16 flex items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-10">
          <div className="flex-1">
            <h1 style={{color:C.text}} className="font-bold text-[15px]">{pageLabel[page]||page}</h1>
            <p style={{color:C.muted}} className="text-[11px]">{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
          </div>
          {/* WA pill */}
          <div onClick={()=>setPage("whatsapp")} style={{background:waStatus==="connected"?C.greenDim:waStatus==="qr"?C.amberDim:"rgba(255,255,255,0.05)",border:`1px solid ${waStatus==="connected"?"rgba(34,197,94,0.3)":waStatus==="qr"?"rgba(245,158,11,0.3)":"rgba(255,255,255,0.1)"}`,color:waStatus==="connected"?C.green:waStatus==="qr"?C.amber:C.muted}} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"/>
            WA {waStatus==="connected"?"Online":waStatus==="qr"?"QR":"Offline"}
          </div>
          {/* Alert */}
          {stats?.atrasados>0&&<button onClick={()=>setPage("crm")} style={{background:C.redDim,border:"1px solid rgba(244,63,94,0.3)",color:C.red}} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold"><AlertTriangle size={11} className="animate-pulse"/>{stats.atrasados} inadimp.</button>}
          {/* Notifs */}
          <div className="relative">
            <button onClick={()=>setShowN(!showN)} style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`}} className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:border-white/20 transition-colors">
              <Bell size={15} style={{color:C.muted}}/>
              {notifs.length>0&&<span style={{background:C.red}} className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-extrabold text-white flex items-center justify-center">{notifs.length}</span>}
            </button>
            {showN&&(
              <div style={{background:C.card,border:`1px solid ${C.border2}`,width:300,top:"calc(100% + 8px)",right:0,position:"absolute",borderRadius:16,overflow:"hidden",zIndex:50}}>
                <div style={{borderBottom:`1px solid ${C.border}`}} className="flex items-center justify-between px-4 py-3">
                  <span style={{color:C.text}} className="font-bold text-sm">Notificações</span>
                  <button onClick={async()=>{ await api("/api/notificacoes",{method:"DELETE"}); setNotifs([]); }} style={{color:C.muted}} className="text-xs hover:text-white">Limpar</button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifs.length===0?<div style={{color:C.muted}} className="text-xs text-center py-8">Sem notificações</div>:notifs.map(n=>(
                    <div key={n.id} style={{borderBottom:`1px solid ${C.border}`}} className="px-4 py-3 hover:bg-white/[0.02]">
                      <div style={{color:C.text}} className="text-xs font-semibold">{n.titulo}</div>
                      <div style={{color:C.muted}} className="text-[11px] mt-0.5">{n.mensagem}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* User */}
          <div className="flex items-center gap-2">
            <div style={{background:`linear-gradient(135deg,${user.cor||C.indigo},${C.purple})`}} className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold text-white select-none">{user.avatar||user.nome?.slice(0,2).toUpperCase()}</div>
            <div className="hidden md:block">
              <div style={{color:C.text}} className="text-xs font-semibold leading-tight">{user.nome}</div>
              <div style={{color:C.muted}} className="text-[10px] capitalize">{user.role?.replace("_"," ")}</div>
            </div>
            <button onClick={logout} style={{color:C.muted,border:`1px solid ${C.border}`}} className="w-8 h-8 rounded-lg flex items-center justify-center hover:border-red-500/40 hover:text-red-400 transition-colors ml-1"><LogOut size={13}/></button>
          </div>
        </header>
        {/* Page */}
        <main style={{background:C.bg}} className="flex-1 overflow-y-auto p-6">
          {PAGES[page]||PAGES.dashboard}
        </main>
      </div>
      {/* Toasts */}
      <div className="pointer-events-none">
        {toasts.map(t=><div key={t.id} className="pointer-events-auto"><Toast msg={t.msg} type={t.type} onClose={()=>setToasts(ts=>ts.filter(x=>x.id!==t.id))}/></div>)}
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner/></AuthProvider>;
}
