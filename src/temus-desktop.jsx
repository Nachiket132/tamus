import { useState, useRef, useEffect, useCallback } from "react";

const F = () => <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;1,400&family=Geist+Mono:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  ::placeholder{color:#3a3428;opacity:1;}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#2a2520;border-radius:4px;}
  textarea,input{font-family:inherit;}
  button{cursor:pointer;}
  button:focus,input:focus,textarea:focus{outline:none;}
`}</style>;

/* ── Tokens ── */
const C = {
  win:"#0f0e0c", bar:"#141210", side:"#111009", main:"#0c0b09",
  card:"#1a1714", border:"#1e1c18", borderHi:"#2e2a22",
  amber:"#c8873a", amberDim:"#7a5020", amberBg:"#1c140a",
  text:"#ddd4c0", sub:"#8a7e6e", muted:"#5a5040", faint:"#2a2520",
  green:"#5aaa72", greenBg:"#0d1a10", blue:"#5a8ec8", blueBg:"#0d1420",
  red:"#c05a4a", teal:"#4a9e8a", tealBg:"#0d1a18",
  purple:"#8a6ec8", purpleBg:"#130f1e", coral:"#c87850", coralBg:"#1a110a",
  pink:"#c85a8a", pinkBg:"#1a0d14",
};

/* ── Tag config ── */
const TAGS = {
  "":           { c:C.amber,  bg:C.amberBg,   b:C.amberDim,  s:["spark","problem","vision","questions","resources","nextstep"], pl:"General",       pd:"Analyse my idea and help me think it through." },
  "Business":   { c:C.amber,  bg:C.amberBg,   b:C.amberDim,  s:["spark","problem","vision","questions","resources","nextstep"], pl:"Business Plan",  pd:"Create a full business plan — market, revenue model, GTM strategy, milestones." },
  "Product":    { c:C.blue,   bg:C.blueBg,    b:C.blue+"44", s:["spark","problem","vision","questions","resources","nextstep"], pl:"Product Research",pd:"Research the market — real competitors, feature gaps, TAM, MVP scope." },
  "Personal":   { c:C.green,  bg:C.greenBg,   b:C.green+"44",s:["spark","vision","questions","resources","nextstep"],          pl:"Growth Plan",    pd:"Build a personal growth plan with 30-day habits and resources." },
  "Learning":   { c:C.teal,   bg:C.tealBg,    b:C.teal+"44", s:["spark","vision","nextstep"],                                  pl:"Learning Roadmap",pd:"Build a complete learning roadmap — phases, resources, projects, timeline." },
  "Content":    { c:C.coral,  bg:C.coralBg,   b:C.coral+"44",s:["spark","problem","vision","questions","nextstep"],            pl:"Content Strategy",pd:"Create a content strategy — pillars, platform, 4-week calendar, monetisation." },
  "Research":   { c:C.purple, bg:C.purpleBg,  b:C.purple+"44",s:["spark","problem","vision","questions","resources","nextstep"],pl:"Research Framework",pd:"Build a structured research framework with methodology and sources." },
  "Side project":{ c:C.pink,  bg:C.pinkBg,   b:C.pink+"44", s:["spark","problem","vision","questions","resources","nextstep"], pl:"Ship Fast Plan", pd:"Define MVP scope, tech stack, and how to find the first 10 users." },
};

const SECS = {
  spark:     { icon:"✦", label:"The Spark",        guide:"What's the raw idea? Don't filter. Don't edit. Just pour it out." },
  problem:   { icon:"◎", label:"Problem",           guide:"Who is hurting right now? What does their frustration look like?" },
  vision:    { icon:"◈", label:"Vision",            guide:"Two years from now, if this works perfectly — describe that world." },
  questions: { icon:"?", label:"Open Questions",    guide:"Everything you don't know yet. The blind spots are the real risk." },
  resources: { icon:"⬡", label:"Resources",         guide:"What do you have? What's missing? Be brutally honest." },
  nextstep:  { icon:"→", label:"First Move",        guide:"One action. The smallest possible thing that moves this forward." },
};

const STATUS = ["Raw Idea","Blueprinted","In Progress","Shipped","Shelved"];
const STATUS_C = { "Raw Idea":C.muted, "Blueprinted":C.amber, "In Progress":C.blue, "Shipped":C.green, "Shelved":C.faint };

function newIdea(){ return { id:Date.now(), title:"Untitled Blueprint", tag:"", status:"Raw Idea", locked:false, created:Date.now(), sections:Object.fromEntries(Object.keys(SECS).map(k=>[k,""])) }; }

function buildPrompt(idea){
  const cfg = TAGS[idea.tag]||TAGS[""];
  const sids = cfg.s;
  const vals = sids.filter(s=>idea.sections[s]?.trim()).map(s=>`[${SECS[s].label.toUpperCase()}]\n${idea.sections[s]}`).join("\n\n");
  if(!vals) return "";
  const header = `TEMUS BLUEPRINT — ${idea.title}\n${"─".repeat(40)}\n\n${vals}\n\n${"─".repeat(40)}\n`;
  const tasks = {
    "Business": `Based on this blueprint, write a full business plan:\n1. Executive Summary\n2. Market Opportunity\n3. Revenue Model & Pricing\n4. Competitive Landscape\n5. Go-To-Market Strategy\n6. Key Risks\n7. 90-day Milestones`,
    "Product": `Based on this blueprint, research and write:\n1. Market Size (TAM/SAM/SOM)\n2. Top 5 competitors — name them, strengths & weaknesses\n3. Feature gap this product fills\n4. Pricing benchmarks\n5. Technical feasibility\n6. Ruthless MVP scope`,
    "Personal": `Based on this blueprint, build a personal growth plan:\n1. The deeper goal beneath this idea\n2. Internal blockers (mindset, habits)\n3. 30-day action plan\n4. Recommended resources\n5. What success looks like in 3 months`,
    "Learning": `Based on this blueprint, build a complete learning roadmap:\n1. Learning phases (beginner → advanced)\n2. Best resources per phase\n3. Projects to build at each stage\n4. Realistic timeline (1hr/day)\n5. First action to take today`,
    "Content": `Based on this blueprint, create a content strategy:\n1. Audience definition\n2. Content pillars (3–5 themes)\n3. Best formats and platforms\n4. 4-week content calendar\n5. Monetisation options`,
    "Research": `Based on this blueprint, build a research framework:\n1. Sharpen the research question\n2. Methodology recommendation\n3. Primary & secondary sources\n4. Potential biases to watch\n5. First 3 research tasks this week`,
    "Side project": `Based on this blueprint, give me a ship-fast plan:\n1. Ruthless MVP — must-have vs. cut\n2. Specific tech stack recommendation\n3. Build timeline for solo dev on weekends\n4. How to find the first 10 users before building\n5. Week-by-week plan for next 4 weeks`,
  };
  return header + (tasks[idea.tag] || `Help me think through this idea. Identify gaps, risks, and what to focus on first.`);
}

/* ── Growable textarea ── */
function GTA({ value, onChange, placeholder, disabled }){
  const r=useRef(null);
  useEffect(()=>{ if(r.current){r.current.style.height="auto";r.current.style.height=Math.max(120,r.current.scrollHeight)+"px";} },[value]);
  return <textarea ref={r} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} rows={4}
    style={{ display:"block",width:"100%",background:"transparent",border:"none",resize:"none",overflow:"hidden",
      fontFamily:"'Lora',serif",fontSize:16,lineHeight:1.9,color:disabled?C.muted:C.text,caretColor:C.amber,letterSpacing:"0.01em" }}/>;
}

/* ── Copy panel ── */
function CopyDrawer({ idea, onClose }){
  const ta=useRef(null); const [ok,setOk]=useState(false); const [mode,setMode]=useState("smart");
  const cfg=TAGS[idea.tag]||TAGS[""];
  const prompt=buildPrompt(idea);
  const raw=(cfg.s.filter(s=>idea.sections[s]?.trim()).map(s=>`[${SECS[s].label}]\n${idea.sections[s]}`).join("\n\n"));
  const text=mode==="smart"?prompt:raw;

  function copy(){
    if(ta.current){ta.current.select();}
    try{document.execCommand("copy");setOk(true);setTimeout(()=>setOk(false),2000);return;}catch(e){}
    navigator.clipboard?.writeText(text).then(()=>{setOk(true);setTimeout(()=>setOk(false),2000);});
  }

  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:"absolute",inset:0,zIndex:200,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end" }}>
      <div style={{ width:"100%",background:C.card,borderTop:`1px solid ${C.borderHi}`,padding:"20px 24px 24px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex",gap:4,background:C.side,borderRadius:5,padding:2,width:"fit-content",marginBottom:10 }}>
              {[["smart","Smart prompt"],["raw","Raw notes"]].map(([m,l])=>(
                <button key={m} onClick={()=>setMode(m)} style={{ background:mode===m?C.card:"transparent",border:mode===m?`1px solid ${C.border}`:"1px solid transparent",borderRadius:3,color:mode===m?C.text:C.muted,fontFamily:"'Geist Mono',monospace",fontSize:9,padding:"5px 12px",letterSpacing:"0.06em",transition:"all 0.15s" }}>{l}</button>
              ))}
            </div>
            {mode==="smart"&&idea.tag&&(
              <div style={{ fontFamily:"'Geist Mono',monospace",fontSize:9,color:cfg.c,letterSpacing:"0.08em" }}>
                {cfg.pd}
              </div>
            )}
            {!idea.tag&&mode==="smart"&&(
              <div style={{ fontFamily:"'Geist Mono',monospace",fontSize:9,color:C.amberDim }}>
                Set a tag for a specialised prompt (Business plan, Product research, Learning roadmap...)
              </div>
            )}
          </div>
          <button onClick={copy} style={{ background:ok?C.greenBg:cfg.bg,border:`1px solid ${ok?C.green:cfg.b}`,color:ok?C.green:cfg.c,fontFamily:"'Geist Mono',monospace",fontSize:10,padding:"8px 18px",borderRadius:4,letterSpacing:"0.08em",transition:"all 0.2s",whiteSpace:"nowrap" }}>
            {ok?"✓ copied":"⎘ copy"}
          </button>
          <button onClick={onClose} style={{ background:"none",border:`1px solid ${C.border}`,color:C.muted,fontFamily:"'Geist Mono',monospace",fontSize:10,padding:"8px 12px",borderRadius:4 }}>esc</button>
        </div>
        <textarea ref={ta} readOnly value={text||"Fill at least one section first."} onClick={e=>e.target.select()}
          style={{ width:"100%",height:160,background:C.side,border:`1px solid ${C.border}`,borderRadius:5,padding:"10px 12px",fontFamily:"'Geist Mono',monospace",fontSize:10,lineHeight:1.7,color:C.sub,resize:"none" }}/>
        <div style={{ marginTop:8,fontFamily:"'Geist Mono',monospace",fontSize:8,color:C.faint }}>Click the box to select all · then Ctrl+C / Cmd+C · paste into Claude or ChatGPT</div>
      </div>
    </div>
  );
}

/* ── Main App ── */
export default function Temus(){
  const [ideas,setIdeas]=useState([
    { id:1,title:"RushBrew 2.0 — Campus Expansion",tag:"Business",status:"In Progress",locked:false,created:Date.now()-86400000*3,
      sections:{ spark:"Deploy multiple RushBrew kiosks across Ahmedabad and Surat college campuses as a franchise model.",problem:"Students and gym-goers have no access to quality pre-workout drinks on demand. Vending machines only sell junk.",vision:"20 machines across Gujarat by end of 2026. N-One branded kiosks in every major college campus.",questions:"Minimum order qty for powder mix supplier? FSSAI license per machine location?",resources:"",nextstep:"" }
    },
    { id:2,title:"TenderPilot — AI tender finder",tag:"Side project",status:"Raw Idea",locked:false,created:Date.now()-86400000,
      sections:{ spark:"A web app where D and C class contractors type what work they do and get a daily digest of matching government tenders.",problem:"",vision:"",questions:"",resources:"",nextstep:"" }
    },
  ]);
  const [sel,setSel]=useState(1);
  const [secIdx,setSecIdx]=useState(0);
  const [showCopy,setShowCopy]=useState(false);
  const [showStatusMenu,setShowStatusMenu]=useState(false);
  const [showTagMenu,setShowTagMenu]=useState(false);
  const [cmdOpen,setCmdOpen]=useState(false);
  const [cmdQ,setCmdQ]=useState("");
  const [sideCollapsed,setSideCollapsed]=useState(false);

  const idea=ideas.find(i=>i.id===sel)||ideas[0];
  const cfg=TAGS[idea?.tag||""]||TAGS[""];
  const sids=cfg.s;
  const secId=sids[secIdx]||sids[0];
  const sec=SECS[secId];
  const val=idea?.sections[secId]||"";

  const fillCount=sids.filter(s=>idea?.sections[s]?.trim()).length;
  const canLock=fillCount>=Math.min(3,sids.length);

  function upd(patch){ setIdeas(p=>p.map(i=>i.id===idea.id?{...i,...patch}:i)); }
  function updSec(v){ upd({sections:{...idea.sections,[secId]:v}}); }
  function addIdea(){ const n=newIdea(); setIdeas(p=>[n,...p]); setSel(n.id); setSecIdx(0); }
  function goSec(i){ setSecIdx(Math.max(0,Math.min(sids.length-1,i))); }

  // keyboard shortcuts
  useEffect(()=>{
    function kd(e){
      if((e.metaKey||e.ctrlKey)&&e.key==="k"){ e.preventDefault(); setCmdOpen(p=>!p); }
      if(e.key==="Escape"){ setCmdOpen(false); setShowCopy(false); }
      if((e.metaKey||e.ctrlKey)&&e.key==="n"){ e.preventDefault(); addIdea(); }
    }
    window.addEventListener("keydown",kd);
    return ()=>window.removeEventListener("keydown",kd);
  },[]);

  // when tag changes, reset secIdx
  useEffect(()=>{ setSecIdx(0); },[idea?.tag]);

  if(!idea) return null;

  const gridBg={ backgroundImage:`linear-gradient(${C.faint}18 1px,transparent 1px),linear-gradient(90deg,${C.faint}18 1px,transparent 1px)`,backgroundSize:"36px 36px" };

  return(
    <div style={{ width:"100%",height:"100vh",background:C.win,display:"flex",flexDirection:"column",fontFamily:"'Geist Mono',monospace",userSelect:"none",overflow:"hidden",position:"relative" }}>
      <F/>

      {/* ══ TITLE BAR ══ */}
      <div style={{ height:38,background:C.bar,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",flexShrink:0,paddingLeft:14,gap:0,position:"relative" }}>
        {/* Traffic lights */}
        <div style={{ display:"flex",gap:6,marginRight:16 }}>
          {["#ff5f57","#febc2e","#28c840"].map((col,i)=>(
            <div key={i} style={{ width:12,height:12,borderRadius:"50%",background:col,opacity:0.9 }}/>
          ))}
        </div>
        {/* Window title */}
        <div style={{ position:"absolute",left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:11,color:C.amber,fontWeight:500,letterSpacing:"0.06em" }}>TEMUS</span>
          <span style={{ color:C.faint }}>—</span>
          <span style={{ fontSize:11,color:C.muted,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
            {idea.title||"Untitled Blueprint"}
          </span>
        </div>
        {/* Right side */}
        <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:4,paddingRight:12 }}>
          <button onClick={()=>setCmdOpen(true)} style={{ background:"none",border:`1px solid ${C.border}`,borderRadius:4,color:C.muted,fontSize:9,padding:"3px 8px",letterSpacing:"0.06em" }}>
            ⌘K
          </button>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div style={{ flex:1,display:"flex",overflow:"hidden" }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width:sideCollapsed?40:220,flexShrink:0,background:C.side,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",transition:"width 0.2s ease",overflow:"hidden" }}>

          {!sideCollapsed&&<>
            {/* New + collapse */}
            <div style={{ padding:"10px 10px 8px",display:"flex",gap:6,borderBottom:`1px solid ${C.border}` }}>
              <button onClick={addIdea} style={{ flex:1,background:C.amberBg,border:`1px solid ${C.amberDim}`,borderRadius:4,color:C.amber,fontSize:9,padding:"6px 0",letterSpacing:"0.08em" }}>+ new</button>
              <button onClick={()=>setSideCollapsed(true)} style={{ background:"none",border:`1px solid ${C.border}`,borderRadius:4,color:C.muted,fontSize:11,padding:"4px 8px" }}>‹</button>
            </div>

            {/* Ideas list */}
            <div style={{ flex:1,overflowY:"auto",padding:"6px 6px" }}>
              <div style={{ fontSize:8,color:C.faint,letterSpacing:"0.12em",padding:"6px 6px 4px" }}>BLUEPRINTS</div>
              {ideas.map(i=>{
                const c2=TAGS[i.tag]||TAGS[""];
                const isSel=i.id===sel;
                return(
                  <div key={i.id} onClick={()=>{setSel(i.id);setSecIdx(0);}}
                    style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 8px",borderRadius:5,background:isSel?C.card:"transparent",border:isSel?`1px solid ${C.border}`:"1px solid transparent",marginBottom:2,cursor:"pointer",transition:"all 0.1s" }}
                    onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background=C.faint+"44"; }}
                    onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background="transparent"; }}>
                    <div style={{ width:6,height:6,borderRadius:"50%",flexShrink:0,background:i.locked?C.amber:c2.c+"55" }}/>
                    <span style={{ fontSize:11,color:isSel?C.text:C.muted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.3 }}>{i.title}</span>
                  </div>
                );
              })}
            </div>

            {/* Section nav */}
            <div style={{ borderTop:`1px solid ${C.border}`,padding:"6px 6px" }}>
              <div style={{ fontSize:8,color:C.faint,letterSpacing:"0.12em",padding:"4px 6px 6px" }}>SECTIONS</div>
              {sids.map((sid,i)=>{
                const s=SECS[sid]; const filled=idea.sections[sid]?.trim(); const active=i===secIdx;
                return(
                  <div key={sid} onClick={()=>goSec(i)}
                    style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:4,background:active?cfg.bg+"cc":"transparent",border:active?`1px solid ${cfg.b}`:"1px solid transparent",marginBottom:1,cursor:"pointer" }}
                    onMouseEnter={e=>{ if(!active) e.currentTarget.style.background=C.faint+"33"; }}
                    onMouseLeave={e=>{ if(!active) e.currentTarget.style.background="transparent"; }}>
                    <div style={{ width:5,height:5,borderRadius:"50%",flexShrink:0,background:filled?cfg.c:active?cfg.c+"44":C.faint }}/>
                    <span style={{ fontSize:10,color:active?cfg.c:filled?C.sub:C.muted,letterSpacing:"0.04em",flex:1 }}>{s.label}</span>
                    {filled&&<span style={{ fontSize:9,color:cfg.c+"88" }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </>}

          {sideCollapsed&&(
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 0",gap:8 }}>
              <button onClick={()=>setSideCollapsed(false)} style={{ background:"none",border:`1px solid ${C.border}`,borderRadius:4,color:C.muted,fontSize:11,padding:"4px 6px" }}>›</button>
              <button onClick={addIdea} style={{ background:"none",border:`1px solid ${C.amberDim}`,borderRadius:4,color:C.amber,fontSize:11,padding:"4px 6px" }}>+</button>
            </div>
          )}
        </div>

        {/* ── MAIN CANVAS ── */}
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:C.main,...gridBg }}>

          {/* Toolbar strip */}
          <div style={{ height:36,borderBottom:`1px solid ${C.border}`,background:C.bar+"cc",display:"flex",alignItems:"center",padding:"0 16px",gap:8,flexShrink:0 }}>

            {/* Tag selector */}
            <div style={{ position:"relative" }}>
              <button onClick={()=>{setShowTagMenu(p=>!p);setShowStatusMenu(false);}}
                style={{ background:idea.tag?cfg.bg:"none",border:`1px solid ${idea.tag?cfg.b:C.border}`,borderRadius:4,color:idea.tag?cfg.c:C.muted,fontSize:9,padding:"4px 10px",letterSpacing:"0.06em",display:"flex",alignItems:"center",gap:5 }}>
                {idea.tag?<><div style={{ width:5,height:5,borderRadius:"50%",background:cfg.c }}/>{idea.tag}</>:"tag"}
                <span style={{ color:C.faint }}>▾</span>
              </button>
              {showTagMenu&&(
                <div style={{ position:"absolute",top:"110%",left:0,zIndex:100,background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:5,minWidth:160,overflow:"hidden" }}>
                  {[{k:"",l:"No tag"},...Object.keys(TAGS).filter(k=>k).map(k=>({k,l:k}))].map(({k,l})=>{
                    const c2=TAGS[k]||TAGS[""];
                    return(
                      <div key={k} onClick={()=>{upd({tag:k});setShowTagMenu(false);}}
                        style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 12px",cursor:"pointer",fontFamily:"'Geist Mono',monospace",fontSize:9,color:k?c2.c:C.muted }}
                        onMouseEnter={e=>e.currentTarget.style.background=C.side}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        {k&&<div style={{ width:6,height:6,borderRadius:"50%",background:c2.c,flexShrink:0 }}/>}
                        {l}
                        {k&&<span style={{ marginLeft:"auto",color:C.faint,fontSize:8 }}>{TAGS[k].s.length} sections</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Status */}
            <div style={{ position:"relative" }}>
              <button onClick={()=>{setShowStatusMenu(p=>!p);setShowTagMenu(false);}}
                style={{ background:"none",border:`1px solid ${STATUS_C[idea.status]||C.border}44`,borderRadius:4,color:STATUS_C[idea.status]||C.muted,fontSize:9,padding:"4px 10px",letterSpacing:"0.06em",display:"flex",alignItems:"center",gap:4 }}>
                {idea.status}<span style={{ color:C.faint }}>▾</span>
              </button>
              {showStatusMenu&&(
                <div style={{ position:"absolute",top:"110%",left:0,zIndex:100,background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:5,minWidth:140,overflow:"hidden" }}>
                  {STATUS.map(s=>(
                    <div key={s} onClick={()=>{upd({status:s});setShowStatusMenu(false);}}
                      style={{ padding:"8px 12px",cursor:"pointer",fontFamily:"'Geist Mono',monospace",fontSize:9,color:STATUS_C[s]||C.muted }}
                      onMouseEnter={e=>e.currentTarget.style.background=C.side}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex:1 }}/>

            {/* Progress dots */}
            <div style={{ display:"flex",gap:3,alignItems:"center" }}>
              {sids.map((s,i)=>(
                <div key={s} onClick={()=>goSec(i)} style={{ width:i===secIdx?16:6,height:5,borderRadius:3,background:i===secIdx?cfg.c:idea.sections[s]?.trim()?cfg.c+"55":C.faint,transition:"all 0.2s",cursor:"pointer" }}/>
              ))}
              <span style={{ fontSize:8,color:C.faint,marginLeft:4 }}>{fillCount}/{sids.length}</span>
            </div>

            {/* Copy to AI */}
            <button onClick={()=>setShowCopy(true)}
              style={{ background:cfg.bg,border:`1px solid ${cfg.b}`,color:cfg.c,fontSize:9,padding:"4px 12px",borderRadius:4,letterSpacing:"0.06em",display:"flex",alignItems:"center",gap:5 }}>
              ⎘
              <span>copy to ai</span>
              {idea.tag&&<span style={{ background:cfg.c+"22",borderRadius:20,padding:"1px 6px",fontSize:8 }}>{idea.tag}</span>}
            </button>

            {/* Lock */}
            {!idea.locked
              ? <button onClick={()=>canLock&&upd({locked:true,status:"Blueprinted"})} style={{ background:canLock?cfg.bg:"none",border:`1px solid ${canLock?cfg.c:C.faint}`,color:canLock?cfg.c:C.faint,fontSize:9,padding:"4px 12px",borderRadius:4,letterSpacing:"0.06em" }}>
                  {canLock?"◈ lock":`${Math.min(3,sids.length)-fillCount} more`}
                </button>
              : <div style={{ fontSize:9,color:C.amber,letterSpacing:"0.08em",display:"flex",alignItems:"center",gap:4 }}>
                  <span>◈</span><span>locked</span>
                  <button onClick={()=>upd({locked:false})} style={{ background:"none",border:`1px solid ${C.border}`,color:C.muted,fontSize:8,padding:"2px 6px",borderRadius:3,marginLeft:2 }}>unlock</button>
                </div>
            }
          </div>

          {/* Writing area */}
          <div style={{ flex:1,overflowY:"auto",display:"flex",flexDirection:"column" }}>
            <div style={{ maxWidth:640,width:"100%",margin:"0 auto",padding:"40px 48px 80px",flex:1 }}>

              {/* Idea title */}
              <input value={idea.title} disabled={idea.locked}
                onChange={e=>upd({title:e.target.value})}
                style={{ width:"100%",background:"transparent",border:"none",fontFamily:"'Lora',serif",fontSize:24,color:idea.title?C.text:C.muted,fontStyle:idea.title?"normal":"italic",caretColor:C.amber,marginBottom:32,letterSpacing:"0.01em",lineHeight:1.3 }}
                placeholder="Idea title..."/>

              {/* Section header */}
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                <span style={{ fontSize:10,color:C.amberDim,letterSpacing:"0.1em" }}>{String(secIdx+1).padStart(2,"0")}</span>
                <span style={{ color:cfg.c,fontSize:11 }}>{sec.icon}</span>
                <span style={{ fontSize:10,color:cfg.c,letterSpacing:"0.1em",textTransform:"uppercase" }}>{sec.label}</span>
              </div>

              {/* Guide question */}
              <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:20,color:C.muted,lineHeight:1.6,marginBottom:24,letterSpacing:"0.01em" }}>
                {sec.guide}
              </div>

              <div style={{ height:1,background:C.border,marginBottom:22 }}/>

              {/* Text input */}
              <GTA value={val} onChange={e=>updSec(e.target.value)} placeholder="Write freely..." disabled={idea.locked}/>

              {val.trim()&&<div style={{ marginTop:10,fontSize:8,color:C.faint }}>{val.trim().split(/\s+/).filter(Boolean).length} words</div>}

              {/* Nav arrows */}
              <div style={{ display:"flex",gap:8,marginTop:40 }}>
                <button onClick={()=>goSec(secIdx-1)} disabled={secIdx===0}
                  style={{ background:"none",border:`1px solid ${secIdx===0?C.faint:C.border}`,borderRadius:4,color:secIdx===0?C.faint:C.muted,fontSize:9,padding:"7px 14px",letterSpacing:"0.06em" }}>← prev</button>
                <button onClick={()=>goSec(secIdx+1)} disabled={secIdx===sids.length-1}
                  style={{ background:"none",border:`1px solid ${secIdx===sids.length-1?C.faint:C.border}`,borderRadius:4,color:secIdx===sids.length-1?C.faint:C.muted,fontSize:9,padding:"7px 14px",letterSpacing:"0.06em" }}>next →</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — idea meta ── */}
        <div style={{ width:180,flexShrink:0,borderLeft:`1px solid ${C.border}`,background:C.side,display:"flex",flexDirection:"column",padding:"14px 12px",gap:14 }}>

          <div>
            <div style={{ fontSize:8,color:C.faint,letterSpacing:"0.12em",marginBottom:8 }}>BLUEPRINT INFO</div>
            <div style={{ fontSize:9,color:C.muted,marginBottom:3 }}>Created</div>
            <div style={{ fontSize:10,color:C.sub }}>{new Date(idea.created).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>
          </div>

          <div style={{ height:1,background:C.border }}/>

          <div>
            <div style={{ fontSize:9,color:C.muted,marginBottom:6 }}>Fill progress</div>
            <div style={{ height:2,background:C.faint,borderRadius:2,overflow:"hidden",marginBottom:5 }}>
              <div style={{ height:"100%",background:cfg.c,width:`${(fillCount/sids.length)*100}%`,transition:"width 0.4s",borderRadius:2 }}/>
            </div>
            <div style={{ fontSize:8,color:cfg.c }}>{fillCount}/{sids.length} sections</div>
          </div>

          <div style={{ height:1,background:C.border }}/>

          <div>
            <div style={{ fontSize:8,color:C.faint,letterSpacing:"0.12em",marginBottom:8 }}>SECTIONS</div>
            {sids.map((sid,i)=>{
              const filled=idea.sections[sid]?.trim();
              const active=i===secIdx;
              return(
                <div key={sid} onClick={()=>goSec(i)}
                  style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 6px",borderRadius:3,cursor:"pointer",marginBottom:2,background:active?cfg.bg:"transparent" }}
                  onMouseEnter={e=>{ if(!active) e.currentTarget.style.background=C.faint+"33"; }}
                  onMouseLeave={e=>{ if(!active) e.currentTarget.style.background=active?cfg.bg:"transparent"; }}>
                  <div style={{ width:4,height:4,borderRadius:"50%",flexShrink:0,background:filled?cfg.c:active?cfg.c+"44":C.faint }}/>
                  <span style={{ fontSize:9,color:active?cfg.c:filled?C.sub:C.muted,letterSpacing:"0.03em" }}>{SECS[sid].label}</span>
                </div>
              );
            })}
          </div>

          <div style={{ height:1,background:C.border }}/>

          {/* Word counts */}
          <div>
            <div style={{ fontSize:8,color:C.faint,letterSpacing:"0.12em",marginBottom:8 }}>WORD COUNT</div>
            {sids.map(sid=>{
              const w=idea.sections[sid]?.trim().split(/\s+/).filter(Boolean).length||0;
              return w>0?(
                <div key={sid} style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                  <span style={{ fontSize:9,color:C.muted }}>{SECS[sid].label}</span>
                  <span style={{ fontSize:9,color:C.sub }}>{w}w</span>
                </div>
              ):null;
            })}
          </div>

          <div style={{ flex:1 }}/>

          {/* Keyboard shortcuts */}
          <div style={{ borderTop:`1px solid ${C.border}`,paddingTop:12 }}>
            <div style={{ fontSize:8,color:C.faint,letterSpacing:"0.12em",marginBottom:8 }}>SHORTCUTS</div>
            {[["⌘K","Command palette"],["⌘N","New blueprint"]].map(([k,l])=>(
              <div key={k} style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                <span style={{ fontSize:8,color:C.muted }}>{l}</span>
                <span style={{ fontSize:8,color:C.amberDim,background:C.amberBg,padding:"1px 5px",borderRadius:3 }}>{k}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div style={{ height:22,background:C.bar,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 14px",gap:16,flexShrink:0 }}>
        <span style={{ fontSize:8,color:C.amberDim,letterSpacing:"0.1em" }}>TEMUS</span>
        <span style={{ fontSize:8,color:C.faint }}>·</span>
        <span style={{ fontSize:8,color:STATUS_C[idea.status]||C.muted,letterSpacing:"0.06em" }}>{idea.status}</span>
        {idea.tag&&<><span style={{ fontSize:8,color:C.faint }}>·</span><span style={{ fontSize:8,color:cfg.c }}>{idea.tag}</span></>}
        <span style={{ fontSize:8,color:C.faint }}>·</span>
        <span style={{ fontSize:8,color:C.muted }}>{SECS[secId]?.label}</span>
        <div style={{ flex:1 }}/>
        <span style={{ fontSize:8,color:C.faint }}>● auto-saved</span>
        {idea.locked&&<><span style={{ fontSize:8,color:C.faint }}>·</span><span style={{ fontSize:8,color:C.amber }}>◈ locked</span></>}
      </div>

      {/* ── COMMAND PALETTE ── */}
      {cmdOpen&&(
        <div onClick={e=>{ if(e.target===e.currentTarget){setCmdOpen(false);setCmdQ("");} }}
          style={{ position:"absolute",inset:0,zIndex:300,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80 }}>
          <div style={{ width:480,background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:8,overflow:"hidden" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderBottom:`1px solid ${C.border}` }}>
              <span style={{ color:C.muted,fontSize:12 }}>⌘</span>
              <input autoFocus value={cmdQ} onChange={e=>setCmdQ(e.target.value)}
                placeholder="Search or run a command..."
                style={{ flex:1,background:"transparent",border:"none",color:C.text,fontSize:13,fontFamily:"'Geist Mono',monospace",letterSpacing:"0.04em" }}/>
              <span style={{ fontSize:9,color:C.faint,padding:"2px 6px",border:`1px solid ${C.border}`,borderRadius:3 }}>esc</span>
            </div>
            <div style={{ padding:6 }}>
              {[
                { label:"New blueprint", key:"⌘N", action:()=>{ addIdea(); setCmdOpen(false); } },
                { label:"Next section",  key:"→",   action:()=>{ goSec(secIdx+1); setCmdOpen(false); } },
                { label:"Prev section",  key:"←",   action:()=>{ goSec(secIdx-1); setCmdOpen(false); } },
                { label:"Copy to AI",    key:"",     action:()=>{ setShowCopy(true); setCmdOpen(false); } },
                { label:`Lock blueprint${canLock?"":" (need more sections)"}`, key:"", action:()=>{ if(canLock){upd({locked:true});} setCmdOpen(false); } },
                ...ideas.map(i=>({ label:`Open: ${i.title}`, key:"", action:()=>{ setSel(i.id); setSecIdx(0); setCmdOpen(false); } })),
              ].filter(c=>!cmdQ||c.label.toLowerCase().includes(cmdQ.toLowerCase())).map((c,i)=>(
                <div key={i} onClick={c.action}
                  style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderRadius:5,cursor:"pointer",fontSize:11,color:C.text }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.amberBg}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span>{c.label}</span>
                  {c.key&&<span style={{ fontSize:9,color:C.amberDim,background:C.amberBg,padding:"2px 7px",borderRadius:3 }}>{c.key}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Copy drawer */}
      {showCopy&&<CopyDrawer idea={idea} onClose={()=>setShowCopy(false)}/>}
    </div>
  );
}
