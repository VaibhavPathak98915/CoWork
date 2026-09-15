import { Btn } from "../components/ui.jsx";
import { usePlans } from "../hooks/usePlans.js";
import { formatINR, shortPeriod, annualisedCost } from "../lib/format.js";

/* ═══════════════════════════════════════════
   PLANS
═══════════════════════════════════════════ */

const Skeleton = ({h=12,w="100%",style={}}) => (
  <div style={{height:h,width:w,borderRadius:6,background:"linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 37%,var(--surface2) 63%)",backgroundSize:"400% 100%",animation:"shimmer 1.4s ease infinite",...style}}/>
);

/**
 * What this plan saves over a year against the cheapest shorter-commitment plan.
 * Computed rather than written down, so it can't contradict the prices beside it.
 */
const savingsAgainst = (plan, plans) => {
  const mine = annualisedCost(plan);
  const cheapestOther = Math.min(
    ...plans.filter((p) => p.id !== plan.id).map(annualisedCost)
  );
  const saved = cheapestOther - mine;
  return saved > 0 ? saved : null;
};

const Plans = ({setPage, showToast, selectedPlanId, setSelectedPlanId}) => {
  const { plans, error, loading, refresh } = usePlans();

  const choose = (plan) => {
    setSelectedPlanId(plan.id);
    setPage("payment");
    showToast(`✅ ${plan.name} selected!`);
  };

  return (
    <div className="fade-in">
      <p style={{color:"var(--muted)",fontSize:14,marginBottom:24}}>
        Choose the plan that fits your workflow. All plans include high-speed WiFi &amp; 24/7 access.
      </p>

      {error && (
        <div style={{padding:"12px 16px",marginBottom:16,background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:10,fontSize:13,color:"var(--red)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <span>⚠ {error}</span>
          <Btn variant="ghost" style={{fontSize:12,padding:"6px 14px"}} onClick={refresh}>Retry</Btn>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
        {loading && [0,1,2].map(i=>(
          <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:28,display:"flex",flexDirection:"column",gap:14}}>
            <Skeleton h={18} w="55%"/><Skeleton h={11} w="70%"/>
            <Skeleton h={34} w="60%" style={{marginTop:6}}/>
            <div style={{display:"flex",flexDirection:"column",gap:9,marginTop:6}}>
              {[0,1,2,3].map(j=><Skeleton key={j} h={11} w={`${85-j*7}%`}/>)}
            </div>
            <Skeleton h={38} style={{marginTop:10,borderRadius:9}}/>
          </div>
        ))}

        {(plans ?? []).map((p,i)=>{
          const saved = savingsAgainst(p, plans);
          return (
            <div key={p.id} className="fade-up" style={{animationDelay:`${i*.1}s`,
              background:p.featured?"linear-gradient(145deg,#1e1608,var(--surface))":"var(--surface)",
              border:`1px solid ${selectedPlanId===p.id?"var(--accent)":p.featured?"var(--accent)":"var(--border)"}`,
              borderRadius:16,padding:28,display:"flex",flexDirection:"column",gap:14,
              position:"relative",overflow:"hidden",transition:"all .25s",cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 20px 40px -12px ${p.color}33`}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=""}}
              onClick={()=>setSelectedPlanId(p.id)}>

              {p.featured&&<div style={{position:"absolute",top:16,right:-24,background:"var(--accent)",color:"#0a0a0a",fontSize:9,fontWeight:800,letterSpacing:2,padding:"4px 32px",transform:"rotate(45deg)"}}>POPULAR</div>}

              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700}}>{p.name}</div>
                <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>{p.tagline}</div>
              </div>

              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:36,fontWeight:800,color:"var(--accent)"}}>
                  <sup style={{fontSize:16,fontWeight:400}}>₹</sup>
                  {formatINR(p.price).replace("₹","")}
                  <sub style={{fontSize:13,fontWeight:400,color:"var(--muted)"}}>/{shortPeriod(p.period)}</sub>
                </div>
                {saved && (
                  <div style={{fontSize:11,color:"var(--green)",fontWeight:600,marginTop:4}}>
                    Save {formatINR(saved)} a year
                  </div>
                )}
              </div>

              <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:9,flex:1}}>
                {p.features.map((f,j)=>(
                  <li key={j} style={{fontSize:13,color:"var(--muted)",display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{color:"var(--green)",fontWeight:700,fontSize:12}}>✓</span>{f}
                  </li>
                ))}
                {p.excluded.map((f,j)=>(
                  <li key={j} style={{fontSize:13,color:"var(--muted)",display:"flex",gap:8,alignItems:"center",opacity:.45,textDecoration:"line-through"}}>
                    <span style={{color:"var(--red)",fontWeight:700,fontSize:12}}>✕</span>{f}
                  </li>
                ))}
              </ul>

              <Btn variant={p.featured?"primary":"ghost"} style={{width:"100%",textAlign:"center"}}
                onClick={e=>{e.stopPropagation();choose(p)}}>
                Select Plan
              </Btn>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Plans;
