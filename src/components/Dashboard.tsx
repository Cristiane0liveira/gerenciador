"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays,
  Check, CheckCheck, ChevronDown, CircleHelp, Clock3, Filter, FolderKanban, LayoutDashboard,
  ListTodo, LogOut, MoreHorizontal, Plus, Search, Settings2, SlidersHorizontal, Sparkles,
  Target, Users, X, Layers3, MessageSquare
} from "lucide-react";
import type { SessionUser } from "@/lib/session";

type Project = { id:string; name:string; description:string; _count?:{tasks:number} };
type UserLite = { id:string; name:string; email:string };
type Task = {
  id:string; title:string; description:string; status:"TODO"|"IN_PROGRESS"|"REVIEW"|"DONE";
  priority:"LOW"|"MEDIUM"|"HIGH"|"URGENT"; dueDate:string|null; projectId:string;
  assigneeId:string|null; assignee:UserLite|null; project:{id:string;name:string}
};

const columns = [
  {key:"TODO",label:"A fazer",color:"#8b94a7"},
  {key:"IN_PROGRESS",label:"Em andamento",color:"#5262db"},
  {key:"REVIEW",label:"Em revisão",color:"#d48a2d"},
  {key:"DONE",label:"Concluídas",color:"#2b9a6a"}
] as const;
const priorityLabel:Record<string,string> = {LOW:"Baixa",MEDIUM:"Média",HIGH:"Alta",URGENT:"Urgente"};
const statusLabel:Record<string,string> = {TODO:"A fazer",IN_PROGRESS:"Em andamento",REVIEW:"Em revisão",DONE:"Concluída"};
const fmtDate=(d:string|null)=>d?new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}):"Sem prazo";
const isLate=(t:Task)=>!!t.dueDate && new Date(t.dueDate)<new Date(new Date().toDateString()) && t.status!=="DONE";

export default function Dashboard({initialUser}:{initialUser:SessionUser}) {
  const router=useRouter();
  const [user,setUser]=useState(initialUser);
  const [projects,setProjects]=useState<Project[]>([]);
  const [tasks,setTasks]=useState<Task[]>([]);
  const [projectId,setProjectId]=useState("all");
  const [view,setView]=useState<"dashboard"|"kanban"|"tasks"|"projects"|"calendar">("dashboard");
  const [query,setQuery]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");
  const [priorityFilter,setPriorityFilter]=useState("all");
  const [modal,setModal]=useState<"task"|"project"|null>(null);
  const [editing,setEditing]=useState<Task|null>(null);
  const [toast,setToast]=useState("");
  const [loading,setLoading]=useState(true);
  const [taskForm,setTaskForm]=useState({title:"",description:"",projectId:"",status:"TODO",priority:"MEDIUM",assigneeId:"",dueDate:""});
  const [projectForm,setProjectForm]=useState({name:"",description:""});
  const [saving,setSaving]=useState(false);
  const [mobileMenu,setMobileMenu]=useState(false);

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const [pr,tr]=await Promise.all([fetch("/api/projects"),fetch("/api/tasks")]);
      if(pr.status===401||tr.status===401){router.push("/login");return;}
      const pd=await pr.json(),td=await tr.json();
      if(!pr.ok)throw new Error(pd.error||"Erro ao carregar projetos");
      if(!tr.ok)throw new Error(td.error||"Erro ao carregar tarefas");
      setProjects(pd.projects);setTasks(td.tasks);
    }catch(e){setToast(e instanceof Error?e.message:"Falha ao carregar dados");}
    finally{setLoading(false);}
  },[router]);

  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(""),3500);return()=>clearTimeout(t);}},[toast]);

  const scoped=useMemo(()=>tasks.filter(t=>(projectId==="all"||t.projectId===projectId)&&t.title.toLowerCase().includes(query.toLowerCase())&&(statusFilter==="all"||t.status===statusFilter)&&(priorityFilter==="all"||t.priority===priorityFilter)),[tasks,projectId,query,statusFilter,priorityFilter]);
  const stats=useMemo(()=>({
    total:tasks.length,done:tasks.filter(t=>t.status==="DONE").length,
    active:tasks.filter(t=>t.status==="IN_PROGRESS").length,
    late:tasks.filter(isLate).length
  }),[tasks]);
  const progress=stats.total?Math.round(stats.done/stats.total*100):0;

  function openTask(task?:Task){
    setEditing(task||null);
    setTaskForm(task?{title:task.title,description:task.description,projectId:task.projectId,status:task.status,priority:task.priority,assigneeId:task.assigneeId||"",dueDate:task.dueDate?new Date(task.dueDate).toISOString().slice(0,10):""}:{title:"",description:"",projectId:projectId==="all"?(projects[0]?.id||""):projectId,status:"TODO",priority:"MEDIUM",assigneeId:"",dueDate:""});
    setModal("task");
  }
  async function saveTask(e:React.FormEvent){
    e.preventDefault();setSaving(true);
    try{
      const url=editing?`/api/tasks/${editing.id}`:"/api/tasks";
      const method=editing?"PATCH":"POST";
      const body={...taskForm,assigneeId:taskForm.assigneeId||null,dueDate:taskForm.dueDate?new Date(`${taskForm.dueDate}T12:00:00`).toISOString():null};
      const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const d=await r.json();if(!r.ok)throw new Error(d.error||"Não foi possível salvar");
      setModal(null);setToast(editing?"Tarefa atualizada.":"Tarefa criada.");await load();
    }catch(e){setToast(e instanceof Error?e.message:"Erro ao salvar");}finally{setSaving(false);}
  }
  async function changeStatus(task:Task,status:string){
    try{const r=await fetch(`/api/tasks/${task.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});const d=await r.json();if(!r.ok)throw new Error(d.error);await load();}
    catch(e){setToast(e instanceof Error?e.message:"Erro ao alterar status");}
  }
  async function deleteTask(task:Task){
    if(!confirm(`Excluir a tarefa "${task.title}"?`))return;
    const r=await fetch(`/api/tasks/${task.id}`,{method:"DELETE"});
    if(!r.ok){const d=await r.json();setToast(d.error||"Erro ao excluir");return;}
    setToast("Tarefa excluída.");await load();
  }
  async function saveProject(e:React.FormEvent){
    e.preventDefault();setSaving(true);
    try{const r=await fetch("/api/projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(projectForm)});const d=await r.json();if(!r.ok)throw new Error(d.error);setModal(null);setProjectForm({name:"",description:""});setToast("Projeto criado.");await load();setProjectId(d.project.id);setView("kanban");}
    catch(e){setToast(e instanceof Error?e.message:"Erro ao criar projeto");}finally{setSaving(false);}
  }
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});router.push("/login");router.refresh();}
  const activeProject=projects.find(p=>p.id===projectId);
  const nav=[
    {id:"dashboard",label:"Visão geral",icon:LayoutDashboard},
    {id:"kanban",label:"Quadro Kanban",icon:FolderKanban},
    {id:"tasks",label:"Todas as tarefas",icon:ListTodo},
    {id:"calendar",label:"Calendário",icon:CalendarDays},
    {id:"projects",label:"Projetos e equipes",icon:Users}
  ] as const;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Layers3 size={19}/></span> atlas hub</div>
      <div><div className="nav-label">WORKSPACE</div>{nav.map(n=><button key={n.id} className={`nav-item ${view===n.id?"active":""}`} onClick={()=>setView(n.id)}><n.icon size={17}/>{n.label}</button>)}</div>
      <div><div className="nav-label">SEUS PROJETOS</div>{projects.slice(0,5).map(p=><button key={p.id} className={`nav-item ${projectId===p.id?"active":""}`} onClick={()=>{setProjectId(p.id);setView("kanban");}}><span style={{width:8,height:8,borderRadius:3,background:["#6875e5","#e1a04a","#37a884","#d7778b","#8b75ce"][projects.indexOf(p)%5]}}/>{p.name}</button>)}<button className="nav-item" onClick={()=>setModal("project")}><Plus size={16}/> Novo projeto</button></div>
      <div className="sidebar-bottom"><div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:800}}><Sparkles size={16} color="#5966d8"/> Foco da equipe</div><p style={{fontSize:11,lineHeight:1.7,color:"#7d869b",margin:"8px 0 0"}}>Pequenos avanços todos os dias constroem grandes entregas.</p></div>
      <button className="nav-item" onClick={logout}><LogOut size={16}/> Sair da conta</button>
    </aside>

    <main className="main">
      <header className="topbar">
        <div><div className="eyebrow">Workspace / {nav.find(n=>n.id===view)?.label||"Atlas Hub"}</div><h1 className="page-title">{view==="dashboard"?"Visão geral":view==="kanban"?"Quadro Kanban":view==="tasks"?"Todas as tarefas":view==="calendar"?"Calendário de tarefas":"Projetos e equipes"}</h1></div>
        <div style={{display:"flex",alignItems:"center",gap:12}}><button className="btn" onClick={()=>setModal("task")}><Plus size={15}/> Nova tarefa</button><div className="avatar" title={user.email}>{user.name.split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase()}</div><div className="hide-small" style={{fontSize:12,fontWeight:700}}>{user.name.split(" ")[0]}<div className="muted" style={{marginTop:3,fontWeight:400}}>{user.role==="ADMIN"?"Administrador":"Membro"}</div></div></div>
      </header>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:20}}>
        <div className="search"><Search size={15} style={{position:"absolute",left:12,top:12,color:"#8c94a5"}}/><input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar tarefas..."/></div>
        <select className="input" style={{width:"auto",minWidth:160}} value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="all">Todos os projetos</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select className="input" style={{width:"auto",minWidth:140}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">Todos os status</option>{columns.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select>
        <select className="input" style={{width:"auto",minWidth:140}} value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}><option value="all">Todas as prioridades</option>{Object.entries(priorityLabel).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
        <button className="btn" onClick={()=>{setQuery("");setProjectId("all");setStatusFilter("all");setPriorityFilter("all");}}><SlidersHorizontal size={14}/> Limpar</button>
      </div>

      {view==="dashboard"&&<>
        <div className="stats-grid">
          {[
            {label:"Total de tarefas",value:stats.total,foot:"No seu espaço de trabalho",icon:ListTodo},
            {label:"Em andamento",value:stats.active,foot:"Atividades em execução",icon:Activity},
            {label:"Concluídas",value:stats.done,foot:`${progress}% do total`,icon:CheckCheck},
            {label:"Atrasadas",value:stats.late,foot:"Precisam de atenção",icon:AlertCircle}
          ].map((s,i)=><div className="card" key={s.label}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span className="stat-label">{s.label}</span><span className="stat-icon"><s.icon size={17}/></span></div><div className="stat-value">{loading?"—":s.value}</div><div className="stat-foot">{s.foot}</div></div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.55fr) minmax(260px,1fr)",gap:16,marginBottom:20}}>
          <section className="card"><div className="section-head"><div><h2>Visão do progresso</h2><p className="muted" style={{margin:"5px 0 0"}}>Resumo das entregas do workspace</p></div><Target size={19} color="#5865dc"/></div>
            <div style={{display:"flex",alignItems:"baseline",gap:8,margin:"20px 0 12px"}}><span style={{font:"800 32px Manrope"}}>{progress}%</span><span className="muted">das tarefas concluídas</span></div>
            <div style={{height:9,background:"#eef0f7",borderRadius:10,overflow:"hidden"}}><div style={{width:`${progress}%`,height:"100%",background:"linear-gradient(90deg,#4658d9,#8290ff)",borderRadius:10,transition:"width .3s"}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}><span className="muted">{stats.done} concluídas</span><span className="muted">{stats.total-stats.done} restantes</span></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:23}}>{columns.slice(0,3).map(c=><div key={c.key} style={{background:"#f8f9fc",borderRadius:10,padding:11}}><div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#858da0"}}><span style={{width:6,height:6,borderRadius:6,background:c.color}}/>{c.label}</div><div style={{font:"700 20px Manrope",marginTop:7}}>{tasks.filter(t=>t.status===c.key).length}</div></div>)}</div>
          </section>
          <section className="card"><div className="section-head"><div><h2>Projetos</h2><p className="muted" style={{margin:"5px 0 0"}}>Acompanhe suas frentes</p></div><button className="btn" onClick={()=>setModal("project")}><Plus size={14}/></button></div>
            {projects.length===0?<div className="empty">Crie seu primeiro projeto para começar.</div>:projects.slice(0,4).map(p=>{const pt=tasks.filter(t=>t.projectId===p.id);const done=pt.filter(t=>t.status==="DONE").length;const pct=pt.length?Math.round(done/pt.length*100):0;return <button key={p.id} onClick={()=>{setProjectId(p.id);setView("kanban");}} style={{width:"100%",textAlign:"left",border:0,background:"transparent",padding:"12px 0",borderBottom:"1px solid #f0f1f6"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:700,gap:10}}><span>{p.name}</span><span style={{color:"#8a92a3"}}>{pct}%</span></div><div style={{height:5,background:"#eff1f7",borderRadius:5,marginTop:9}}><div style={{width:`${pct}%`,height:5,background:"#6875e5",borderRadius:5}}/></div><div className="muted" style={{marginTop:6}}>{pt.length} tarefas</div></button>})}
          </section>
        </div>
        <section className="card"><div className="section-head"><div><h2>Tarefas recentes</h2><p className="muted" style={{margin:"5px 0 0"}}>O que está acontecendo agora</p></div><button className="btn" onClick={()=>setView("tasks")}>Ver todas <ArrowRight size={14}/></button></div><TaskTable tasks={[...scoped].slice(0,6)} onEdit={openTask} onDelete={deleteTask}/></section>
      </>}

      {view==="kanban"&&<section><div className="section-head"><div><h2>{activeProject?.name||"Todos os projetos"}</h2><p className="muted" style={{margin:"5px 0 0"}}>Acompanhe e atualize o andamento das tarefas</p></div><button className="btn btn-primary" onClick={()=>openTask()}><Plus size={14}/> Adicionar tarefa</button></div>
        <div className="kanban">{columns.map(col=>{const list=scoped.filter(t=>t.status===col.key);return <div className="kanban-col" key={col.key}><div className="kanban-title"><span style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:8,height:8,borderRadius:8,background:col.color}}/>{col.label}</span><span style={{color:"#858da0"}}>{list.length}</span></div>{list.map(t=><div className="task-card" key={t.id}><div style={{display:"flex",justifyContent:"space-between",gap:5}}><span className={`pill priority-${t.priority}`}>{priorityLabel[t.priority]}</span><button title="Editar tarefa" onClick={()=>openTask(t)} style={{border:0,background:"transparent",color:"#9299a8",padding:0}}><MoreHorizontal size={17}/></button></div><h3>{t.title}</h3>{t.description&&<p style={{fontSize:11,color:"#858da0",lineHeight:1.6,margin:"0 0 8px"}}>{t.description}</p>}<div style={{fontSize:10,color:"#7d8699"}}>{t.project.name}</div><div className="task-meta"><span style={{color:isLate(t)?"#d64c46":undefined}}><CalendarDays size={11} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/>{fmtDate(t.dueDate)}</span><span className="avatar" style={{width:25,height:25,fontSize:9}} title={t.assignee?.name||"Sem responsável"}>{t.assignee?.name.split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase()||"—"}</span></div><div style={{marginTop:10}}><select className="input" style={{padding:"6px 7px",fontSize:10}} aria-label="Alterar status" value={t.status} onChange={e=>changeStatus(t,e.target.value)}>{columns.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select></div><div style={{display:"flex",justifyContent:"flex-end",marginTop:8,gap:6}}><button className="btn" style={{padding:"5px 7px",fontSize:10}} onClick={()=>openTask(t)}>Editar</button><button className="btn" style={{padding:"5px 7px",fontSize:10}} onClick={()=>deleteTask(t)}>Excluir</button></div></div>)}</div>})}</div>
      </section>}

      {view==="tasks"&&<section className="card"><div className="section-head"><div><h2>Lista de tarefas</h2><p className="muted" style={{margin:"5px 0 0"}}>{scoped.length} resultados encontrados</p></div><button className="btn btn-primary" onClick={()=>openTask()}><Plus size={14}/> Nova tarefa</button></div><TaskTable tasks={scoped} onEdit={openTask} onDelete={deleteTask}/></section>}

      {view==="projects"&&<section><div className="section-head"><div><h2>Projetos do workspace</h2><p className="muted" style={{margin:"5px 0 0"}}>Organize o trabalho em frentes de entrega</p></div><button className="btn btn-primary" onClick={()=>setModal("project")}><Plus size={14}/> Novo projeto</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>{projects.map(p=>{const pt=tasks.filter(t=>t.projectId===p.id);return <button key={p.id} className="card" style={{textAlign:"left",border: "1px solid var(--line)"}} onClick={()=>{setProjectId(p.id);setView("kanban");}}><div className="stat-icon"><FolderKanban size={18}/></div><h3 style={{fontSize:15,margin:"15px 0 6px"}}>{p.name}</h3><p className="muted" style={{lineHeight:1.6,minHeight:36}}>{p.description||"Sem descrição."}</p><div style={{display:"flex",justifyContent:"space-between",marginTop:15,paddingTop:12,borderTop:"1px solid var(--line)"}}><span className="muted">{pt.length} tarefas</span><ArrowRight size={15}/></div></button>})}{projects.length===0&&<div className="empty">Nenhum projeto ainda. Crie um para começar.</div>}</div></section>}

      {view==="calendar"&&<section className="card"><div className="section-head"><div><h2>Próximos prazos</h2><p className="muted" style={{margin:"5px 0 0"}}>Tarefas organizadas pela data de entrega</p></div></div>{[...scoped].filter(t=>t.dueDate).sort((a,b)=>new Date(a.dueDate!).getTime()-new Date(b.dueDate!).getTime()).map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:13,padding:"13px 0",borderBottom:"1px solid #f0f1f6"}}><div style={{width:48,height:48,borderRadius:11,background:isLate(t)?"#fff0ef":"#f0f1ff",color:isLate(t)?"#d64c46":"#5966d8",display:"grid",placeItems:"center",fontSize:11,fontWeight:800,textAlign:"center"}}>{new Date(t.dueDate!).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}).replace(".","")}</div><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700}}>{t.title}</div><div className="muted" style={{marginTop:4}}>{t.project.name} · {statusLabel[t.status]}</div></div><span className={`pill priority-${t.priority}`}>{priorityLabel[t.priority]}</span><button className="btn" onClick={()=>openTask(t)}>Editar</button></div>)}{scoped.filter(t=>t.dueDate).length===0&&<div className="empty">Nenhuma tarefa com prazo definido para os filtros atuais.</div>}</section>}

      <footer style={{display:"flex",justifyContent:"space-between",gap:12,marginTop:28,color:"#a0a6b5",fontSize:10}}><span>© 2026 Atlas Hub · ATLAS Soluções em Tecnologia</span><span>Feito para trabalhar em sintonia</span></footer>
    </main>

    {modal==="task"&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null);}}><form className="modal" onSubmit={saveTask}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><h2 className="modal-title">{editing?"Editar tarefa":"Nova tarefa"}</h2><p className="muted" style={{margin:"6px 0 0"}}>Organize os detalhes da atividade.</p></div><button className="btn" type="button" onClick={()=>setModal(null)}><X size={16}/></button></div>
      <label className="field-label">Título *</label><input className="input" required minLength={2} maxLength={160} value={taskForm.title} onChange={e=>setTaskForm({...taskForm,title:e.target.value})} placeholder="Ex.: Criar tela de login"/>
      <label className="field-label">Descrição</label><textarea className="input" rows={3} value={taskForm.description} onChange={e=>setTaskForm({...taskForm,description:e.target.value})} placeholder="Contexto e resultado esperado"/>
      <label className="field-label">Projeto *</label><select className="input" required value={taskForm.projectId} onChange={e=>setTaskForm({...taskForm,projectId:e.target.value})}><option value="">Selecione um projeto</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label className="field-label">Status</label><select className="input" value={taskForm.status} onChange={e=>setTaskForm({...taskForm,status:e.target.value})}>{columns.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select></div><div><label className="field-label">Prioridade</label><select className="input" value={taskForm.priority} onChange={e=>setTaskForm({...taskForm,priority:e.target.value})}>{Object.entries(priorityLabel).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div></div>
      <label className="field-label">Prazo</label><input className="input" type="date" value={taskForm.dueDate} onChange={e=>setTaskForm({...taskForm,dueDate:e.target.value})}/>
      <div style={{display:"flex",justifyContent:"flex-end",gap:9,marginTop:23}}><button className="btn" type="button" onClick={()=>setModal(null)}>Cancelar</button><button className="btn btn-primary" disabled={saving}>{saving?"Salvando...":editing?"Salvar alterações":"Criar tarefa"}</button></div>
    </form></div>}

    {modal==="project"&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null);}}><form className="modal" onSubmit={saveProject}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><h2 className="modal-title">Novo projeto</h2><p className="muted" style={{margin:"6px 0 0"}}>Crie um espaço para organizar tarefas.</p></div><button className="btn" type="button" onClick={()=>setModal(null)}><X size={16}/></button></div><label className="field-label">Nome do projeto *</label><input className="input" required minLength={2} maxLength={100} value={projectForm.name} onChange={e=>setProjectForm({...projectForm,name:e.target.value})} placeholder="Ex.: Website institucional"/><label className="field-label">Descrição</label><textarea className="input" rows={3} maxLength={1000} value={projectForm.description} onChange={e=>setProjectForm({...projectForm,description:e.target.value})} placeholder="Objetivo do projeto"/><div style={{display:"flex",justifyContent:"flex-end",gap:9,marginTop:23}}><button className="btn" type="button" onClick={()=>setModal(null)}>Cancelar</button><button className="btn btn-primary" disabled={saving}>{saving?"Criando...":"Criar projeto"}</button></div></form></div>}

    {toast&&<div role="status" style={{position:"fixed",bottom:22,right:22,zIndex:100,background:"#1c2540",color:"white",borderRadius:12,padding:"13px 17px",fontSize:12,boxShadow:"0 12px 35px #11182730",maxWidth:340}}>{toast}</div>}
  </div>;
}

function TaskTable({tasks,onEdit,onDelete}:{tasks:Task[];onEdit:(t:Task)=>void;onDelete:(t:Task)=>void}){
  if(!tasks.length)return <div className="empty">Nenhuma tarefa encontrada. Crie uma tarefa ou ajuste os filtros.</div>;
  return <div className="table-wrap"><table><thead><tr><th>Tarefa</th><th>Projeto</th><th>Responsável</th><th>Status</th><th>Prazo</th><th>Ações</th></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td><div style={{fontWeight:700,color:"#30394f"}}>{t.title}</div><span className={`pill priority-${t.priority}`} style={{marginTop:5}}>{priorityLabel[t.priority]}</span></td><td>{t.project.name}</td><td>{t.assignee?.name||"Não atribuído"}</td><td><span style={{display:"inline-flex",alignItems:"center",gap:6}}><span style={{width:6,height:6,borderRadius:6,background:columns.find(c=>c.key===t.status)?.color}}/>{statusLabel[t.status]}</span></td><td style={{color:isLate(t)?"#d64c46":"inherit"}}>{fmtDate(t.dueDate)}</td><td><div style={{display:"flex",gap:6}}><button className="btn" style={{padding:"6px 8px"}} onClick={()=>onEdit(t)}>Editar</button><button className="btn" style={{padding:"6px 8px"}} onClick={()=>onDelete(t)}>Excluir</button></div></td></tr>)}</tbody></table></div>;
}
