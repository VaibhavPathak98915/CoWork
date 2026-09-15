import { Badge, Btn, Card, CardTitle } from "../components/ui.jsx";
import { useDashboard } from "../hooks/useDashboard.js";
import { useCountUp } from "../hooks/useCountUp.js";

/* ═══════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════ */

/** Grey shimmer stand-in, so the layout doesn't jump when data lands. */
const Skeleton = ({h=12,w="100%",style={}}) => (
  <div style={{height:h,width:w,borderRadius:6,background:"linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 37%,var(--surface2) 63%)",backgroundSize:"400% 100%",animation:"shimmer 1.4s ease infinite",...style}}/>
);

const StatCard = ({stat, index, loading}) => {
  const value = useCountUp(stat?.value);
  return (
    <div className="fade-up" style={{animationDelay:`${index*.07}s`,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:20,position:"relative",overflow:"hidden",cursor:"default",transition:"transform .2s, border-color .2s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor="var(--muted)"}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor="var(--border)"}}>
      <div style={{position:"absolute",top:0,right:0,width:55,height:55,borderRadius:"0 14px 0 55px",background:stat?.color??"var(--accent)",opacity:.15}}/>
      <div style={{fontSize:22,marginBottom:12}}>{stat?.icon??"…"}</div>
      {loading
        ? <Skeleton h={28} w={70}/>
        : <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800}}>{value ?? "—"}</div>}
      <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>{stat?.label}</div>
      <div style={{fontSize:11,marginTop:8,color:stat?.up?"var(--green)":"var(--red)"}}>{loading?"":stat?.change}</div>
    </div>
  );
};

/** "2h ago" reads better than a timestamp in a list this short. */
const relativeTime = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime())/60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins/60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs/24)}d ago`;
};

const bookingTint = {
  "Open Desks":"rgba(232,160,69,.1)", "Private Cabins":"rgba(96,165,250,.1)",
  "Meeting Rooms":"rgba(74,222,128,.1)", "Event Space":"rgba(255,107,53,.1)",
  "Podcast Studio":"rgba(192,132,252,.1)",
};

const Dashboard = ({showToast}) => {
  const { data, error, live, refresh } = useDashboard();
  const loading = !data && !error;

  const stats = data?.stats ?? [{icon:"🏢",label:"Active Members"},{icon:"📅",label:"Bookings Today"}];
  const bookings = data?.recentBookings ?? [];
  const spaces = data?.occupancy ?? [];
  const membership = data?.membership;

  return (
    <div className="fade-in">
      {error && (
        <div style={{padding:"12px 16px",marginBottom:16,background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:10,fontSize:13,color:"var(--red)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <span>⚠ {error}</span>
          <Btn variant="ghost" style={{fontSize:12,padding:"6px 14px"}} onClick={refresh}>Retry</Btn>
        </div>
      )}

      {/* Only shown when something is actually wrong, so it reads as a warning
          rather than decoration. */}
      {data?.degraded?.length > 0 && (
        <div style={{padding:"10px 14px",marginBottom:16,background:"rgba(232,160,69,.08)",border:"1px solid rgba(232,160,69,.25)",borderRadius:10,fontSize:12,color:"var(--accent)"}}>
          ⚠ Showing partial data — {data.degraded.join(", ")} {data.degraded.length===1?"is":"are"} unavailable.
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:24}}>
        {stats.map((s,i)=><StatCard key={s.label??i} stat={s} index={i} loading={loading}/>)}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:20}}>
        <Card>
          <CardTitle action={live?"● live":"↻ refresh"} onAction={live?undefined:refresh}>Recent Bookings</CardTitle>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {loading && [0,1,2,3].map(i=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:"var(--surface2)",borderRadius:10,border:"1px solid var(--border)"}}>
                <Skeleton h={36} w={36} style={{borderRadius:8,flexShrink:0}}/>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                  <Skeleton h={11} w="40%"/><Skeleton h={9} w="65%"/>
                </div>
              </div>
            ))}

            {!loading && bookings.length===0 && (
              <div style={{padding:"28px 14px",textAlign:"center",color:"var(--muted)",fontSize:13}}>
                No bookings yet — use <strong style={{color:"var(--text)"}}>+ Book Space</strong> to make the first one.
              </div>
            )}

            {bookings.map((b)=>(
              <div key={b.id} className="fade-up" style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:"var(--surface2)",borderRadius:10,border:"1px solid var(--border)"}}>
                <div style={{width:36,height:36,borderRadius:8,background:bookingTint[b.spaceType]??"rgba(232,160,69,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>👤</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600}}>{b.userName}</div>
                  <div style={{fontSize:11,color:"var(--muted)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {b.spaceName} · {b.duration} · {b.seats} seat{b.seats===1?"":"s"} · {relativeTime(b.createdAt)}
                  </div>
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
              {loading && [0,1,2,3,4].map(i=>(
                <div key={i}><Skeleton h={10} w="55%" style={{marginBottom:6}}/><Skeleton h={6}/></div>
              ))}
              {spaces.map((sp)=>(
                <div key={sp.label}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                    <span>{sp.label}</span>
                    <span style={{color:sp.value==null?"var(--muted)":sp.color,fontWeight:600}}
                      title={sp.value==null?"Occupancy unavailable":`${sp.seats} of ${sp.capacity} seats booked today`}>
                      {sp.value==null?"—":`${sp.value}%`}
                    </span>
                  </div>
                  <div style={{height:6,background:"var(--surface2)",borderRadius:999,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${sp.value ?? 0}%`,background:sp.color,borderRadius:999,transition:"width 1.2s ease"}}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{background:"linear-gradient(145deg,#1a1408,var(--surface))"}}>
            <div style={{fontSize:28,marginBottom:8}}>⭐</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700}}>{membership?.tier ?? "Member"}</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>
              {membership?.points == null
                ? "—"
                : `${membership.points} pts · ${membership.bookings} booking${membership.bookings===1?"":"s"}`}
            </div>
            <Btn style={{marginTop:14,width:"100%",padding:"9px 0",textAlign:"center"}} onClick={()=>showToast("🎁 Rewards redeemed!")}>Redeem Rewards</Btn>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
