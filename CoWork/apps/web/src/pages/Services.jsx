import { useState } from "react";
import { Badge, Card, CardTitle } from "../components/ui.jsx";

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

export default Services;
