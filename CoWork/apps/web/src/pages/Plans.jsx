import { useState } from "react";
import { Btn } from "../components/ui.jsx";

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

export default Plans;
