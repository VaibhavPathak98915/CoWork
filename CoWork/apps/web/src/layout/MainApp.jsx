import { useState, useRef } from "react";
import { Btn } from "../components/ui.jsx";
import Toast from "../components/Toast.jsx";
import BookSpaceModal from "./BookSpaceModal.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Plans from "../pages/Plans.jsx";
import Spaces from "../pages/Spaces.jsx";
import Services from "../pages/Services.jsx";
import Payment from "../pages/Payment.jsx";

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
const pages = {dashboard:Dashboard, plans:Plans, spaces:Spaces, services:Services, payment:Payment};

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

  // Fall back to the dashboard rather than rendering `undefined` (which throws)
  // if something ever navigates to a page id that isn't registered above.
  const PageComp = pages[page] || Dashboard;

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
            {user.name?.[0]?.toUpperCase() ?? "?"}
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

      <BookSpaceModal
        open={modalOpen}
        onClose={()=>setModalOpen(false)}
        onBooked={(booking)=>showToast(`✅ ${booking.spaceName} booked for ${booking.startsOn}`)}
      />

      <Toast msg={toast.msg} visible={toast.visible}/>
    </div>
  );
};

export default MainApp;
