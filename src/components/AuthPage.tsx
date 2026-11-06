"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Layers3, ShieldCheck, Users } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível continuar.");
      router.push("/"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Ocorreu um erro."); }
    finally { setLoading(false); }
  }

  return <main className="auth-wrap">
    <section className="auth-side">
      <div className="brand" style={{padding:0,color:"white"}}><span className="brand-mark" style={{background:"white",color:"#4658d9"}}><Layers3 size={20}/></span> atlas hub</div>
      <div style={{position:"relative",zIndex:1,maxWidth:470}}>
        <div style={{fontSize:11,letterSpacing:2,fontWeight:800,color:"#aeb8ff",marginBottom:18}}>TRABALHO EM SINTONIA</div>
        <h1 style={{fontSize:"clamp(32px,4vw,48px)",lineHeight:1.13,letterSpacing:-1.8,margin:"0 0 18px"}}>Todo projeto começa com clareza.</h1>
        <p style={{color:"#d0d5f5",lineHeight:1.8,fontSize:14}}>Organize tarefas, conecte pessoas e acompanhe cada entrega em um só lugar.</p>
        <div style={{display:"grid",gap:17,marginTop:38}}>
          {[["Gestão sem complicação","Tarefas, prioridades e prazos em um só painel.",CheckCircle2],["Equipe conectada","Responsabilidades claras para cada pessoa.",Users],["Visão do progresso","Saiba o que avançou e o que precisa de atenção.",ShieldCheck]].map(([title,desc,Icon]:any)=><div key={title} style={{display:"flex",gap:13,alignItems:"center"}}><div style={{width:38,height:38,borderRadius:11,background:"#ffffff17",display:"grid",placeItems:"center"}}><Icon size={18}/></div><div><div style={{fontSize:13,fontWeight:700}}>{title}</div><div style={{fontSize:11,color:"#c2c9ed",marginTop:4}}>{desc}</div></div></div>)}
        </div>
      </div>
      <div style={{fontSize:11,color:"#b8c0e8",position:"relative",zIndex:1}}>ATLAS — Soluções em Tecnologia</div>
    </section>
    <section className="auth-form">
      <form className="auth-form-inner" onSubmit={submit}>
        <div style={{fontSize:11,fontWeight:800,color:"#5865dc",letterSpacing:1.5,marginBottom:12}}>{mode === "login" ? "BEM-VINDO DE VOLTA" : "COMECE AGORA"}</div>
        <h2 style={{font:"800 28px Manrope",letterSpacing:-1,margin:"0 0 8px"}}>{mode === "login" ? "Entre na sua conta" : "Crie sua conta"}</h2>
        <p className="muted" style={{lineHeight:1.7,marginBottom:23}}>{mode === "login" ? "Acesse seu espaço de trabalho no Atlas Hub." : "O primeiro cadastro será o administrador inicial."}</p>
        {mode === "register" && <><label className="field-label">Nome completo</label><input className="input" value={name} onChange={e=>setName(e.target.value)} minLength={2} required placeholder="Seu nome"/></>}
        <label className="field-label">E-mail</label><input className="input" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="voce@empresa.com"/>
        <label className="field-label">Senha</label><input className="input" type="password" autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} minLength={mode==="register"?8:1} required placeholder={mode==="register"?"Pelo menos 8 caracteres":"Sua senha"}/>
        {error && <div role="alert" style={{marginTop:13,padding:11,borderRadius:9,background:"#fff0ef",color:"#b93832",fontSize:12}}>{error}</div>}
        <button className="btn btn-primary" disabled={loading} style={{width:"100%",marginTop:22,padding:12,justifyContent:"center"}}>{loading?"Aguarde...":mode==="login"?"Entrar no Atlas Hub":"Criar conta"} <ArrowRight size={15}/></button>
        <p style={{fontSize:12,textAlign:"center",color:"#858da0",marginTop:23}}>{mode==="login"?"Ainda não tem uma conta?":"Já possui uma conta?"} <button type="button" onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}} style={{border:0,background:"none",color:"#4658d9",fontWeight:800}}>{mode==="login"?"Criar conta":"Fazer login"}</button></p>
      </form>
    </section>
  </main>;
}
