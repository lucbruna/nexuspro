import { createContext, useContext, useState, useEffect } from "react";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user,   setUser]   = useState(null);
  const [token,  setToken]  = useState(localStorage.getItem("nexus_token")||null);
  const [loading,setLoading]= useState(true);
  useEffect(()=>{
    if (token) {
      fetch("/api/auth/me",{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.ok?r.json():null).then(u=>{ if(u) setUser(u); else logout(); }).catch(()=>logout()).finally(()=>setLoading(false));
    } else setLoading(false);
  },[]);
  const login=async(email,senha)=>{
    const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,senha})});
    const d=await r.json(); if(!r.ok) throw new Error(d.error||"Erro ao fazer login");
    localStorage.setItem("nexus_token",d.token); setToken(d.token); setUser(d.user); return d;
  };
  const logout=()=>{ localStorage.removeItem("nexus_token"); setToken(null); setUser(null); };
  const can=(...roles)=>{ if(!user) return false; if(user.role==="super_admin") return true; return roles.includes(user.role); };
  return <AuthContext.Provider value={{user,token,loading,login,logout,can}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
