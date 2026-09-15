import { useState, useEffect, useRef } from "react";
import { Input } from "../components/ui.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";

/* ═══════════════════════════════════════════
   AUTH SCREEN
═══════════════════════════════════════════ */
const AuthScreen = () => {
  const { login, register } = useAuth();
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
    // Keep the particle field matched to the panel when the window is resized,
    // clamping stray points back inside the new bounds so they don't get stuck.
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      pts.forEach(p => {
        p.x = Math.min(p.x, canvas.width);
        p.y = Math.min(p.y, canvas.height);
      });
    };
    window.addEventListener("resize", resize);
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
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async () => {
    setErr("");

    // Cheap client-side checks first, so obvious mistakes never cost a round trip.
    // The server re-validates everything regardless — see packages/shared/schemas.js.
    if(tab==="login"){
      if(!form.email||!form.password){ setErr("Please fill in all fields."); return; }
    } else {
      if(!form.name||!form.email||!form.password){ setErr("Please fill in all fields."); return; }
      if(form.password!==form.confirm){ setErr("Passwords don't match."); return; }
    }

    setLoading(true);
    try {
      if(tab==="login"){
        await login({email:form.email, password:form.password});
      } else {
        await register({name:form.name, email:form.email, password:form.password, role:form.role});
      }
      // On success AuthProvider sets the user and <Root> swaps this screen out,
      // so there is nothing to do here — and no setState on an unmounted tree.
    } catch (e) {
      setErr(e.message);
      setLoading(false);
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
              {/* SECURITY: anyone can register as Admin here. Fine for the demo,
                  but this must become an invite or promotion flow before the app
                  is exposed to real users. Server-side rule: shared/schemas.js. */}
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
              💡 <strong style={{color:"var(--text)"}}>Demo account:</strong> <em>admin@cowork.dev</em> / <em>cowork123</em>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
