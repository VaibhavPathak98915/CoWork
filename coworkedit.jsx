import { useState, useEffect, useRef } from "react";

/* ─────────────── GLOBAL STYLES ─────────────── */
const injectStyles = () => {
  if (document.getElementById("cw-styles")) return;
  const s = document.createElement("style");
  s.id = "cw-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    :root{
      --bg:#09090b;--surface:#111113;--surface2:#1a1a1e;--surface3:#222228;
      --border:#2a2a32;--accent:#e8a045;--accent2:#ff6b35;
      --text:#f0ede8;--muted:#77767e;--green:#4ade80;--red:#f87171;--blue:#60a5fa;
      --purple:#c084fc;
    }
    html,body,#root{height:100%;font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px}
    input,select,textarea{font-family:'DM Sans',sans-serif;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes barGrow{from{height:0}to{height:var(--h)}}
    .fade-up{animation:fadeUp .4s ease both}
    .fade-in{animation:fadeIn .3s ease both}
    .float{animation:float 4s ease-in-out infinite}
  `;
  document.head.appendChild(s);
};

/* ─────────────── HELPERS ─────────────── */
const S = (obj) => Object.entries(obj).reduce((a,[k,v])=>({...a,[k]:v}),{});

const Badge = ({type, children}) => {
  const colors = {
    active:  {bg:"rgba(74,222,128,.12)",  color:"#4ade80"},
    pending: {bg:"rgba(232,160,69,.12)",  color:"#e8a045"},
    expired: {bg:"rgba(248,113,113,.12)", color:"#f87171"},
    blue:    {bg:"rgba(96,165,250,.12)",  color:"#60a5fa"},
  };
  const c = colors[type] || colors.active;
  return (
    <span style={{padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:600,background:c.bg,color:c.color}}>
      {children}
    </span>
  );
};

const Input = ({label, ...props}) => (
  <div style={{marginBottom:16}}>
    {label && <label style={{display:"block",fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>{label}</label>}
    <input style={{width:"100%",padding:"11px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:14,outline:"none",transition:"border-color .2s"}}
      onFocus={e=>e.target.style.borderColor="var(--accent)"}
      onBlur={e=>e.target.style.borderColor="var(--border)"}
      {...props}/>
  </div>
);

const Select = ({label, options, ...props}) => (
  <div style={{marginBottom:16}}>
    {label && <label style={{display:"block",fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>{label}</label>}
    <select style={{width:"100%",padding:"11px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:14,outline:"none"}} {...props}>
      {options.map(o=><option key={o}>{o}</option>)}
    </select>
  </div>
);

const Btn = ({variant="primary", style={}, children, ...rest}) => {
  const base = {padding:"10px 22px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,transition:"all .2s",...style};
  const variants = {
    primary: {background:"var(--accent)",color:"#0a0a0a"},
    ghost:   {background:"transparent",color:"var(--muted)",border:"1px solid var(--border)"},
    danger:  {background:"rgba(248,113,113,.15)",color:"var(--red)",border:"1px solid rgba(248,113,113,.3)"},
  };
  return <button style={{...base,...variants[variant]}} {...rest}>{children}</button>;
};

const Card = ({children, style={}}) => (
  <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:22,...style}}>
    {children}
  </div>
);

const CardTitle = ({children, action, onAction}) => (
  <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <span>{children}</span>
    {action && <span style={{color:"var(--muted)",fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:400,cursor:"pointer"}} onClick={onAction}>{action}</span>}
  </div>
);

/* ─────────────── TOAST ─────────────── */
const Toast = ({msg, visible}) => (
  <div style={{
    position:"fixed",bottom:28,right:28,
    background:"var(--surface)",border:`1px solid var(--green)`,
    color:"var(--green)",padding:"12px 20px",borderRadius:10,
    fontSize:13,fontWeight:500,zIndex:999,
    transform:visible?"translateY(0)":"translateY(80px)",
    opacity:visible?1:0,transition:"all .4s",pointerEvents:"none"
  }}>{msg}</div>
);

/* ─────────────── MODAL ─────────────── */
const Modal = ({open, onClose, title, children}) => (
  <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{
    position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,
    display:"flex",alignItems:"center",justifyContent:"center",
    opacity:open?1:0,pointerEvents:open?"all":"none",transition:"opacity .3s"
  }}>
    <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:18,padding:32,width:440,maxWidth:"90vw",transform:open?"scale(1)":"scale(.95)",transition:"transform .3s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
      </div>
      {children}
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   AUTH SCREEN
═══════════════════════════════════════════ */
const AuthScreen = ({onAuth}) => {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({name:"",email:"",password:"",confirm:"",role:"User"});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const canvasRef = useRef(null);

  // Animated background particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const pts = Array.from({length:60}, () => ({
      x: Math.random()*canvas.width, y: Math.random()*canvas.height,
      vx:(Math.random()-.5)*.4, vy:(Math.random()-.5)*.4,
      r: Math.random()*1.5+.5
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>canvas.width) p.vx*=-1;
        if(p.y<0||p.y>canvas.height) p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle="rgba(232,160,69,.4)"; ctx.fill();
      });
      pts.forEach((a,i) => pts.slice(i+1).forEach(b => {
        const d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<100){ ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          ctx.strokeStyle=`rgba(232,160,69,${.08*(1-d/100)})`; ctx.stroke(); }
      }));
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = () => {
    setErr("");
    if(tab==="login"){
      if(!form.email||!form.password){ setErr("Please fill in all fields."); return; }
      setLoading(true);
      setTimeout(()=>{ setLoading(false); onAuth({name: form.email.split("@")[0], role: form.email.includes("admin")?"Admin":"User"}); },1200);
    } else {
      if(!form.name||!form.email||!form.password){ setErr("Please fill in all fields."); return; }
      if(form.password!==form.confirm){ setErr("Passwords don't match."); return; }
      setLoading(true);
      setTimeout(()=>{ setLoading(false); onAuth({name:form.name, role:form.role}); },1400);
    }
  };

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",position:"relative"}}>
      {/* Left panel */}
      <div style={{flex:1,position:"relative",display:"flex",flexDirection:"column",justifyContent:"center",padding:"60px 64px",overflow:"hidden",background:"var(--bg)"}}>
        <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.6}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div className="float" style={{marginBottom:48}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:48,fontWeight:800,color:"var(--accent)",letterSpacing:4,lineHeight:1}}>CO<br/>WORK</div>
            <div style={{fontSize:13,letterSpacing:3,color:"var(--muted)",marginTop:8,textTransform:"uppercase"}}>Space Management</div>
          </div>
          {["🏢 24/7 Smart Access","🚀 300+ Active Members","☕ Premium Amenities","📊 Real-time Analytics"].map((t,i)=>(
            <div key={i} className="fade-up" style={{animationDelay:`${i*.1}s`,display:"flex",alignItems:"center",gap:12,marginBottom:16,padding:"12px 16px",background:"rgba(232,160,69,.06)",borderRadius:10,border:"1px solid rgba(232,160,69,.1)"}}>
              <span style={{fontSize:18}}>{t.split(" ")[0]}</span>
              <span style={{fontSize:13,color:"var(--muted)"}}>{t.slice(t.indexOf(" ")+1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{width:480,background:"var(--surface)",borderLeft:"1px solid var(--border)",display:"flex",flexDirection:"column",justifyContent:"center",padding:"48px 48px",overflowY:"auto"}}>
        {/* Tabs */}
        <div style={{display:"flex",gap:0,marginBottom:32,background:"var(--surface2)",borderRadius:10,padding:4}}>
          {["login","register"].map(t=>(
            <button key={t} onClick={()=>{setTab(t);setErr("");}}
              style={{flex:1,padding:"9px 0",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,transition:"all .2s",
                background:tab===t?"var(--accent)":"transparent",
                color:tab===t?"#0a0a0a":"var(--muted)"}}>
              {t==="login"?"Sign In":"Register"}
            </button>
          ))}
        </div>

        <div key={tab} className="fade-up">
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,marginBottom:4}}>
            {tab==="login"?"Welcome back 👋":"Create account ✦"}
          </div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:28}}>
            {tab==="login"?"Sign in to your workspace dashboard":"Join the COWORK community today"}
          </div>

          {tab==="register" && (
            <>
              <Input label="Full Name" placeholder="Rahul Sharma" value={form.name} onChange={e=>set("name",e.target.value)}/>
              <div style={{marginBottom:16}}>
                <label style={{display:"block",fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>Account Type</label>
                <div style={{display:"flex",gap:10}}>
                  {["User","Admin","Staff"].map(r=>(
                    <button key={r} onClick={()=>set("role",r)}
                      style={{flex:1,padding:"9px 0",borderRadius:8,border:`1px solid ${form.role===r?"var(--accent)":"var(--border)"}`,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",background:form.role===r?"rgba(232,160,69,.1)":"transparent",color:form.role===r?"var(--accent)":"var(--muted)",transition:"all .2s"}}>
                      {r==="User"?"👤 User":r==="Admin"?"⊛ Admin":"🛠 Staff"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={e=>set("email",e.target.value)}/>
          <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={e=>set("password",e.target.value)}/>
          {tab==="register" && <Input label="Confirm Password" type="password" placeholder="••••••••" value={form.confirm} onChange={e=>set("confirm",e.target.value)}/>}

          {tab==="login" && (
            <div style={{textAlign:"right",marginTop:-8,marginBottom:16}}>
              <span style={{fontSize:12,color:"var(--accent)",cursor:"pointer"}}>Forgot password?</span>
            </div>
          )}

          {err && (
            <div style={{padding:"10px 14px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:8,fontSize:13,color:"var(--red)",marginBottom:16}}>
              ⚠ {err}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{width:"100%",padding:14,borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,background:"var(--accent)",color:"#0a0a0a",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:loading?.7:1}}>
            {loading ? <span style={{width:18,height:18,border:"2px solid #0a0a0a",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite",display:"inline-block"}}></span> : null}
            {loading?"Authenticating...":(tab==="login"?"Sign In →":"Create Account →")}
          </button>

          {tab==="login" && (
            <div style={{marginTop:20,padding:"14px",background:"var(--surface2)",borderRadius:10,border:"1px solid var(--border)",fontSize:12,color:"var(--muted)"}}>
              💡 <strong style={{color:"var(--text)"}}>Demo:</strong> Use any email/password. Use <em>admin@...</em> for admin role.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════ */
const Dashboard = ({setPage, showToast}) => {
  const stats = [
    {icon:"🏢",val:"142",label:"Active Members",change:"↑ 12% this month",up:true,c:"var(--accent)"},
    {icon:"📅",val:"38",label:"Bookings Today",change:"↑ 5 from yesterday",up:true,c:"var(--blue)"},
  ];
  const bookings = [
    {name:"Priya Mehta",detail:"Hot Desk · Daily · 9AM–6PM",status:"active",bg:"rgba(232,160,69,.1)"},
    {name:"Amit Verma",detail:"Private Office · Monthly",status:"active",bg:"rgba(96,165,250,.1)"},
    {name:"Sneha Rao",detail:"Meeting Room · 2hrs",status:"pending",bg:"rgba(74,222,128,.1)"},
    {name:"Karan Singh",detail:"Virtual Office · Monthly",status:"expired",bg:"rgba(248,113,113,.1)"},
  ];
  const spaces = [
    {label:"Open Desks",val:76,c:"var(--accent)"},
    {label:"Private Cabins",val:92,c:"var(--blue)"},
    {label:"Meeting Rooms",val:58,c:"var(--green)"},
    {label:"Event Space",val:40,c:"var(--accent2)"},
    {label:"Podcast Studio",val:30,c:"var(--purple)"},
  ];

  return (
    <div className="fade-in">
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:24}}>
        {stats.map((s,i)=>(
          <div key={i} className="fade-up" style={{animationDelay:`${i*.07}s`,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:20,position:"relative",overflow:"hidden",cursor:"default",transition:"transform .2s, border-color .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor="var(--muted)"}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor="var(--border)"}}>
            <div style={{position:"absolute",top:0,right:0,width:55,height:55,borderRadius:"0 14px 0 55px",background:s.c,opacity:.15}}/>
            <div style={{fontSize:22,marginBottom:12}}>{s.icon}</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800}}>{s.val}</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>{s.label}</div>
            <div style={{fontSize:11,marginTop:8,color:s.up?"var(--green)":"var(--red)"}}>{s.change}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:20}}>
        <Card>
          <CardTitle action="View all →" onAction={()=>setPage("admin")}>Recent Bookings</CardTitle>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {bookings.map((b,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:"var(--surface2)",borderRadius:10,border:"1px solid var(--border)"}}>
                <div style={{width:36,height:36,borderRadius:8,background:b.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>👤</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{b.name}</div>
                  <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{b.detail}</div>
                </div>
                <Badge type={b.status}>{b.status.charAt(0).toUpperCase()+b.status.slice(1)}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <Card>
            <CardTitle>Space Occupancy</CardTitle>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {spaces.map((sp,i)=>(
                <div key={i}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                    <span>{sp.label}</span><span style={{color:sp.c,fontWeight:600}}>{sp.val}%</span>
                  </div>
                  <div style={{height:6,background:"var(--surface2)",borderRadius:999,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${sp.val}%`,background:sp.c,borderRadius:999,transition:"width 1.2s ease"}}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{background:"linear-gradient(145deg,#1a1408,var(--surface))"}}>
            <div style={{fontSize:28,marginBottom:8}}>⭐</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700}}>Gold Member</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>142 pts · Renews Apr 30</div>
            <Btn style={{marginTop:14,width:"100%",padding:"9px 0",textAlign:"center"}} onClick={()=>showToast("🎁 Rewards redeemed!")}>Redeem Rewards</Btn>
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   PLANS
═══════════════════════════════════════════ */
const Plans = ({setPage, showToast}) => {
  const plans = [
    {name:"Day Pass",sub:"Hot Desk Access",price:"499",per:"day",features:["Open desk workspace","High-speed WiFi","Complimentary coffee","Locker access"],no:["Private cabin","Meeting room credits"],c:"var(--blue)"},
    {name:"Monthly Flex",sub:"Best for Freelancers",price:"7,999",per:"mo",features:["Dedicated hot desk","High-speed WiFi","Unlimited coffee & tea","Locker access","4 meeting room hrs/mo","Community events"],no:[],featured:true,c:"var(--accent)"},
    {name:"Private Office",sub:"For Teams 2–8",price:"24,999",per:"mo",features:["Dedicated private cabin","Business address","16 meeting room hrs/mo","Catering add-ons","Dedicated support staff","GST invoice & reports"],no:[],c:"var(--purple)"},
  ];
  const [sel, setSel] = useState(null);

  return (
    <div className="fade-in">
      <p style={{color:"var(--muted)",fontSize:14,marginBottom:24}}>Choose the plan that fits your workflow. All plans include high-speed WiFi & 24/7 access.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
        {plans.map((p,i)=>(
          <div key={i} className="fade-up" style={{animationDelay:`${i*.1}s`,
            background:p.featured?"linear-gradient(145deg,#1e1608,var(--surface))":"var(--surface)",
            border:`1px solid ${sel===i?"var(--accent)":p.featured?"var(--accent)":"var(--border)"}`,
            borderRadius:16,padding:28,display:"flex",flexDirection:"column",gap:14,
            position:"relative",overflow:"hidden",transition:"all .25s",cursor:"pointer"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 20px 40px -12px ${p.c}33`}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=""}}
            onClick={()=>setSel(i)}>
            {p.featured&&<div style={{position:"absolute",top:16,right:-24,background:"var(--accent)",color:"#0a0a0a",fontSize:9,fontWeight:800,letterSpacing:2,padding:"4px 32px",transform:"rotate(45deg)"}}>POPULAR</div>}
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700}}>{p.name}</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>{p.sub}</div>
            </div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:36,fontWeight:800,color:"var(--accent)"}}>
              <sup style={{fontSize:16,fontWeight:400}}>₹</sup>{p.price}<sub style={{fontSize:13,fontWeight:400,color:"var(--muted)"}}>/{p.per}</sub>
            </div>
            <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:9,flex:1}}>
              {p.features.map((f,j)=>(
                <li key={j} style={{fontSize:13,color:"var(--muted)",display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{color:"var(--green)",fontWeight:700,fontSize:12}}>✓</span>{f}
                </li>
              ))}
              {p.no.map((f,j)=>(
                <li key={j} style={{fontSize:13,color:"var(--muted)",display:"flex",gap:8,alignItems:"center",opacity:.45,textDecoration:"line-through"}}>
                  <span style={{color:"var(--red)",fontWeight:700,fontSize:12}}>✕</span>{f}
                </li>
              ))}
            </ul>
            <Btn variant={p.featured?"primary":"ghost"} style={{width:"100%",textAlign:"center"}}
              onClick={e=>{e.stopPropagation();setPage("payment");showToast(`✅ ${p.name} selected!`)}}>
              Select Plan
            </Btn>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   SPACES
═══════════════════════════════════════════ */
const Spaces = ({showToast}) => {
  const spaces = [
    {icon:"💼",name:"Open Work Floor",meta:"Floor 2 · 60 seats · Quiet zone",price:"₹499/day",status:"active",bg:"linear-gradient(135deg,#1a1408,#2a2010)"},
    {icon:"🏛️",name:"Private Cabin A",meta:"Floor 3 · 4 seats · Soundproof",price:"₹3,500/day",status:"pending",bg:"linear-gradient(135deg,#0d1a2a,#0d2040)"},
    {icon:"📽️",name:"Conference Hall",meta:"Floor 4 · 20 seats · AV Setup",price:"₹8,000/day",status:"active",bg:"linear-gradient(135deg,#0d2010,#152010)"},
  ];
  const statusLabel = {active:"Available",pending:"2 Left",expired:"Booked"};

  return (
    <div className="fade-in">
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
        {spaces.map((sp,i)=>(
          <div key={i} className="fade-up" style={{animationDelay:`${i*.08}s`,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden",transition:"all .25s",cursor:"pointer"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor="var(--muted)"}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor="var(--border)"}}
            onClick={()=>sp.status!=="expired"&&showToast(`📅 ${sp.name} booking initiated!`)}>
            <div style={{height:140,display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,background:sp.bg,position:"relative"}}>
              {sp.icon}
              {sp.status==="expired"&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"var(--red)",fontWeight:600}}>FULLY BOOKED</div>}
            </div>
            <div style={{padding:16}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15}}>{sp.name}</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>{sp.meta}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:14}}>
                <div style={{fontWeight:700,fontSize:14,color:"var(--accent)"}}>{sp.price}</div>
                <Badge type={sp.status}>
                  <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:sp.status==="active"?"var(--green)":sp.status==="pending"?"var(--accent)":"var(--red)",marginRight:5}}/>
                  {statusLabel[sp.status]}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   SERVICES
═══════════════════════════════════════════ */
const Services = ({showToast}) => {
  const services = [
    {icon:"🍽️",name:"Food & Beverages",desc:"Catering, snacks, meals on demand"},
    {icon:"🚗",name:"Conveyance",desc:"Cab booking, airport transfers"},
    {icon:"💻",name:"IT Support",desc:"Tech setup, printer, projector"},
    {icon:"🔒",name:"Secure Locker",desc:"Daily or monthly locker rental"},
  ];
  const [active, setActive] = useState([0,3]);
  const addons = [
    {name:"Food & Beverages",plan:"Daily Lunch",cost:"₹250/day",status:"active"},
    {name:"Secure Locker",plan:"Monthly",cost:"₹500/mo",status:"active"},
    {name:"Conveyance",plan:"On-demand",cost:"₹350/trip",status:"pending"},
  ];

  const toggle = (i) => {
    setActive(prev => prev.includes(i) ? prev.filter(x=>x!==i) : [...prev,i]);
    showToast(active.includes(i)?`🗑 ${services[i].name} removed`:`✅ ${services[i].name} added!`);
  };

  return (
    <div className="fade-in">
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        {services.map((sv,i)=>(
          <div key={i} className="fade-up" style={{animationDelay:`${i*.06}s`,
            background:active.includes(i)?"rgba(232,160,69,.07)":"var(--surface)",
            border:`1px solid ${active.includes(i)?"var(--accent)":"var(--border)"}`,
            borderRadius:14,padding:22,textAlign:"center",cursor:"pointer",transition:"all .25s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
            onMouseLeave={e=>e.currentTarget.style.transform=""}
            onClick={()=>toggle(i)}>
            <div style={{fontSize:32,marginBottom:12}}>{sv.icon}</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700}}>{sv.name}</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:6}}>{sv.desc}</div>
            {active.includes(i)&&<div style={{marginTop:10,fontSize:11,color:"var(--accent)",fontWeight:600}}>✓ Added</div>}
          </div>
        ))}
      </div>
      <Card>
        <CardTitle>Active Add-ons</CardTitle>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr>{["Service","Plan","Cost","Status"].map(h=>(
              <th key={h} style={{fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",padding:"10px 14px",borderBottom:"1px solid var(--border)",textAlign:"left"}}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {addons.map((a,i)=>(
              <tr key={i} style={{borderBottom:i<addons.length-1?"1px solid var(--border)":"none"}}>
                <td style={{padding:"12px 14px",fontSize:13}}>{a.name}</td>
                <td style={{padding:"12px 14px",fontSize:13,color:"var(--muted)"}}>{a.plan}</td>
                <td style={{padding:"12px 14px",fontSize:13,color:"var(--accent)",fontWeight:600}}>{a.cost}</td>
                <td style={{padding:"12px 14px"}}><Badge type={a.status}>{a.status.charAt(0).toUpperCase()+a.status.slice(1)}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

/* ═══════════════════════════════════════════
   PAYMENT
═══════════════════════════════════════════ */
const Payment = ({showToast}) => {
  const [method, setMethod] = useState("Card");
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({name:"",card:"",expiry:"",cvv:"",upi:""});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handlePay = () => {
    setDone(true);
    showToast("✅ Payment of ₹8,499 successful!");
  };

  if(done) return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:20}}>
      <div style={{fontSize:72}} className="float">✅</div>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800}}>Payment Successful!</div>
      <div style={{color:"var(--muted)",fontSize:14}}>₹8,499 · Monthly Flex Plan · Apr 2026</div>
      <Btn onClick={()=>setDone(false)}>Make Another Payment</Btn>
    </div>
  );

  return (
    <div className="fade-in" style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:24}}>
      <div>
        <Card style={{marginBottom:20}}>
          <CardTitle>Payment Method</CardTitle>
          <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            {["💳 Card","📱 UPI","🏦 Net Banking","💰 Wallet"].map(m=>(
              <button key={m} onClick={()=>setMethod(m.split(" ")[1])}
                style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${method===m.split(" ")[1]?"var(--accent)":"var(--border)"}`,background:method===m.split(" ")[1]?"rgba(232,160,69,.08)":"var(--surface2)",color:method===m.split(" ")[1]?"var(--accent)":"var(--muted)",fontSize:12,cursor:"pointer",transition:"all .2s",fontFamily:"'DM Sans',sans-serif"}}>
                {m}
              </button>
            ))}
          </div>

          {method==="Card"&&(
            <>
              <Input label="Cardholder Name" placeholder="Rahul Sharma" value={form.name} onChange={e=>set("name",e.target.value)}/>
              <Input label="Card Number" placeholder="4242 4242 4242 4242" value={form.card} onChange={e=>set("card",e.target.value)}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Input label="Expiry" placeholder="MM/YY" value={form.expiry} onChange={e=>set("expiry",e.target.value)}/>
                <Input label="CVV" placeholder="•••" type="password" value={form.cvv} onChange={e=>set("cvv",e.target.value)}/>
              </div>
            </>
          )}
          {method==="UPI"&&<Input label="UPI ID" placeholder="name@upi" value={form.upi} onChange={e=>set("upi",e.target.value)}/>}
          {method==="Net Banking"&&<Select label="Select Bank" options={["SBI","HDFC","ICICI","Axis","Kotak","Other"]}/>}
          {method==="Wallet"&&<Select label="Select Wallet" options={["Paytm","PhonePe","Amazon Pay","MobiKwik"]}/>}

          <button onClick={handlePay}
            style={{width:"100%",padding:14,borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,background:"var(--accent)",color:"#0a0a0a",marginTop:4,transition:"all .2s"}}
            onMouseEnter={e=>e.target.style.background="#f0b055"}
            onMouseLeave={e=>e.target.style.background="var(--accent)"}>
            Pay ₹8,499 →
          </button>
        </Card>
      </div>

      <div>
        <div style={{background:"var(--surface2)",borderRadius:12,padding:22,border:"1px solid var(--border)",marginBottom:16}}>
          <CardTitle>Order Summary</CardTitle>
          {[["Monthly Flex Plan","₹7,999"],["Food Add-on","₹250"],["Secure Locker","₹500"],["🎉 Member Discount","– ₹250"]].map(([k,v],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"8px 0",borderBottom:"1px solid var(--border)",color:k.startsWith("🎉")?"var(--green)":"var(--text)"}}>
              <span style={{color:"var(--muted)"}}>{k}</span><span>{v}</span>
            </div>
          ))}
          <div style={{height:1,background:"var(--border)",margin:"12px 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15,color:"var(--accent)"}}>
            <span>Total</span><span>₹8,499</span>
          </div>
        </div>
        <Card style={{background:"linear-gradient(145deg,#1a1408,var(--surface))"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{fontSize:32}}>⭐</div>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>Gold Member</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>You'll earn 84 pts for this purchase</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   MAIN APP (after auth)
═══════════════════════════════════════════ */
const navItems = [
  {id:"dashboard",icon:"⬡",label:"Dashboard",section:"Main"},
  {id:"plans",icon:"◈",label:"Plans",section:"Main"},
  {id:"spaces",icon:"⊞",label:"Spaces",section:"Main"},
  {id:"services",icon:"✦",label:"Services",badge:3,section:"Main"},
  {id:"payment",icon:"◎",label:"Payment",section:"Manage"},
];
const pageTitles = {dashboard:"Dashboard",plans:"Plans & Pricing",spaces:"Spaces",services:"Services & Add-ons",payment:"Make Payment"};

const MainApp = ({user, onLogout}) => {
  const [page, setPage] = useState("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState({msg:"",visible:false});
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast({msg,visible:true});
    toastTimer.current = setTimeout(()=>setToast(t=>({...t,visible:false})),3000);
  };

  const sections = [...new Set(navItems.map(n=>n.section))];

  const PageComp = {dashboard:Dashboard, plans:Plans, spaces:Spaces, services:Services, payment:Payment}[page];

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
      {/* Sidebar */}
      <aside style={{width:240,minWidth:240,background:"var(--surface)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",bottom:-80,left:-60,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle, rgba(232,160,69,.12) 0%, transparent 70%)",pointerEvents:"none"}}/>
        <div style={{padding:"28px 24px 20px",borderBottom:"1px solid var(--border)"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,letterSpacing:3,color:"var(--accent)"}}>COWORK</div>
          <div style={{fontSize:10,letterSpacing:2,color:"var(--muted)",textTransform:"uppercase",marginTop:2}}>Space Management</div>
        </div>
        <nav style={{flex:1,padding:"12px 0",overflowY:"auto"}}>
          {sections.map(sec=>(
            <div key={sec}>
              <div style={{padding:"10px 24px 4px",fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"var(--muted)"}}>{sec}</div>
              {navItems.filter(n=>n.section===sec).map(n=>(
                <div key={n.id} onClick={()=>setPage(n.id)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"11px 24px",cursor:"pointer",fontSize:13.5,fontWeight:500,transition:"all .2s",
                    color:page===n.id?"var(--accent)":"var(--muted)",
                    background:page===n.id?"rgba(232,160,69,.06)":"transparent",
                    borderLeft:`2px solid ${page===n.id?"var(--accent)":"transparent"}`}}
                  onMouseEnter={e=>{if(page!==n.id){e.currentTarget.style.color="var(--text)";e.currentTarget.style.background="var(--surface2)"}}}
                  onMouseLeave={e=>{if(page!==n.id){e.currentTarget.style.color="var(--muted)";e.currentTarget.style.background=""}}}>
                  <span style={{fontSize:16,width:20,textAlign:"center"}}>{n.icon}</span>
                  {n.label}
                  {n.badge&&<span style={{marginLeft:"auto",background:"var(--accent2)",color:"#fff",fontSize:10,padding:"2px 7px",borderRadius:999,fontWeight:600}}>{n.badge}</span>}
                </div>
              ))}
            </div>
          ))}
        </nav>
        <div style={{margin:12,padding:"13px 15px",background:"var(--surface2)",borderRadius:12,border:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,var(--accent),var(--accent2))",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff",flexShrink:0}}>
            {user.name[0].toUpperCase()}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
            <div style={{fontSize:11,color:"var(--muted)"}}>{user.role}</div>
          </div>
          <button title="Logout" onClick={onLogout} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:16,padding:2}} onMouseEnter={e=>e.currentTarget.style.color="var(--red)"} onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"}>⏻</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"18px 30px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid var(--border)",background:"var(--bg)",position:"sticky",top:0,zIndex:10}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:700}}>{pageTitles[page]}</div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Btn variant="ghost" style={{fontSize:12}} onClick={()=>showToast("📅 Booking history opened")}>My Bookings</Btn>
            <Btn variant="primary" onClick={()=>setModalOpen(true)}>+ Book Space</Btn>
            <div style={{width:38,height:38,borderRadius:8,background:"var(--surface)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,position:"relative"}}
              onClick={()=>showToast("🔔 No new notifications")}>
              🔔
              <div style={{position:"absolute",top:7,right:8,width:7,height:7,background:"var(--accent2)",borderRadius:"50%",border:"2px solid var(--bg)"}}/>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"26px 30px"}}>
          <PageComp setPage={setPage} showToast={showToast}/>
        </div>
      </main>

      {/* Book Space Modal */}
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title="Book a Space">
        <Select label="Space Type" options={["Open Desk","Private Cabin","Meeting Room","Conference Hall","Podcast Studio","Maker Lab"]}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Date" type="date" defaultValue="2026-04-04"/>
          <Select label="Duration" options={["1 Hour","Half Day","Full Day","Monthly"]}/>
        </div>
        <Select label="Plan" options={["Day Pass – ₹499","Monthly Flex – ₹7,999","Private Office – ₹24,999"]}/>
        <Btn variant="primary" style={{width:"100%",textAlign:"center",padding:13,fontSize:14,marginTop:4}}
          onClick={()=>{setModalOpen(false);showToast("✅ Space booked successfully!")}}>
          Confirm Booking →
        </Btn>
      </Modal>

      <Toast msg={toast.msg} visible={toast.visible}/>
    </div>
  );
};

/* ═══════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════ */
export default function App() {
  injectStyles();
  const [user, setUser] = useState(null);

  return user
    ? <MainApp user={user} onLogout={()=>setUser(null)}/>
    : <AuthScreen onAuth={setUser}/>;
}
