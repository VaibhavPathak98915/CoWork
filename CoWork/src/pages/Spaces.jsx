import { Badge } from "../components/ui.jsx";

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

export default Spaces;
