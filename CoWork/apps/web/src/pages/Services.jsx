import { Badge, Btn, Card, CardTitle } from "../components/ui.jsx";
import { useAddons } from "../addons/AddonsProvider.jsx";
import { formatINR } from "../lib/format.js";

/* ═══════════════════════════════════════════
   SERVICES
═══════════════════════════════════════════ */

const Skeleton = ({h=12,w="100%",style={}}) => (
  <div style={{height:h,width:w,borderRadius:6,background:"linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 37%,var(--surface2) 63%)",backgroundSize:"400% 100%",animation:"shimmer 1.4s ease infinite",...style}}/>
);

const th = {fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",padding:"10px 14px",borderBottom:"1px solid var(--border)",textAlign:"left"};
const td = {padding:"12px 14px",fontSize:13};

const Services = ({showToast}) => {
  const { addons, active, error, loading, refresh, toggle } = useAddons();

  const onToggle = async (addon) => {
    const result = await toggle(addon);
    if (!result.ok) { showToast(`⚠ ${result.message}`); return; }
    showToast(result.subscribed ? `✅ ${addon.name} added!` : `🗑 ${addon.name} removed`);
  };

  return (
    <div className="fade-in">
      {error && (
        <div style={{padding:"12px 16px",marginBottom:16,background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:10,fontSize:13,color:"var(--red)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <span>⚠ {error}</span>
          <Btn variant="ghost" style={{fontSize:12,padding:"6px 14px"}} onClick={refresh}>Retry</Btn>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:16,marginBottom:24}}>
        {loading && [0,1,2,3].map(i=>(
          <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:22,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            <Skeleton h={32} w={32} style={{borderRadius:8}}/>
            <Skeleton h={13} w="65%"/><Skeleton h={11} w="85%"/><Skeleton h={11} w="40%"/>
          </div>
        ))}

        {(addons ?? []).map((sv,i)=>(
          <div key={sv.id} className="fade-up" style={{animationDelay:`${i*.06}s`,
            background:sv.subscribed?"rgba(232,160,69,.07)":"var(--surface)",
            border:`1px solid ${sv.subscribed?"var(--accent)":"var(--border)"}`,
            borderRadius:14,padding:22,textAlign:"center",cursor:"pointer",transition:"all .25s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
            onMouseLeave={e=>e.currentTarget.style.transform=""}
            onClick={()=>onToggle(sv)}>
            <div style={{fontSize:32,marginBottom:12}}>{sv.icon}</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700}}>{sv.name}</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:6}}>{sv.description}</div>
            <div style={{fontSize:12,color:"var(--accent)",fontWeight:600,marginTop:8}}>
              {formatINR(sv.price)}/{sv.unit}
            </div>
            <div style={{marginTop:10,fontSize:11,fontWeight:600,color:sv.subscribed?"var(--accent)":"var(--muted)"}}>
              {sv.subscribed ? "✓ Added" : "+ Add"}
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardTitle>Active Add-ons</CardTitle>

        {/* "You have none" and "we couldn't ask" are different facts. With the
            service down we don't know what's subscribed, so we don't claim zero. */}
        {error ? (
          <div style={{padding:"26px 14px",textAlign:"center",color:"var(--muted)",fontSize:13}}>
            Your add-ons can't be loaded right now.
          </div>
        ) : !loading && active.length === 0 ? (
          <div style={{padding:"26px 14px",textAlign:"center",color:"var(--muted)",fontSize:13}}>
            No add-ons yet — tap a service above to add one.
          </div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr>{["Service","Plan","Cost","Status"].map(h=><th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && [0,1].map(i=>(
                <tr key={i}><td style={td} colSpan={4}><Skeleton h={12}/></td></tr>
              ))}
              {active.map((a,i)=>(
                <tr key={a.id} style={{borderBottom:i<active.length-1?"1px solid var(--border)":"none"}}>
                  <td style={td}>{a.icon} {a.name}</td>
                  <td style={{...td,color:"var(--muted)"}}>{a.planLabel}</td>
                  <td style={{...td,color:"var(--accent)",fontWeight:600}}>{formatINR(a.price)}/{a.unit}</td>
                  <td style={{padding:"12px 14px"}}><Badge type="active">Active</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default Services;
