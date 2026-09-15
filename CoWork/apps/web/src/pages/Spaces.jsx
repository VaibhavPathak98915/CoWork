import { Badge, Btn } from "../components/ui.jsx";
import { useSpaces } from "../hooks/useSpaces.js";
import { formatINR } from "../lib/format.js";

/* ═══════════════════════════════════════════
   SPACES
═══════════════════════════════════════════ */

const Skeleton = ({h=12,w="100%",style={}}) => (
  <div style={{height:h,width:w,borderRadius:6,background:"linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 37%,var(--surface2) 63%)",backgroundSize:"400% 100%",animation:"shimmer 1.4s ease infinite",...style}}/>
);

/** Availability drives the badge, the overlay and whether the card is clickable. */
const AVAILABILITY = {
  available:   { badge: "active",  label: "Available", dot: "var(--green)"  },
  filling:     { badge: "pending", label: "Filling up", dot: "var(--accent)" },
  full:        { badge: "expired", label: "Fully booked", dot: "var(--red)"  },
  unavailable: { badge: "expired", label: "Unavailable", dot: "var(--red)"   },
  unknown:     { badge: "blue",    label: "Availability unknown", dot: "var(--muted)" },
};

// Derives each tile's gradient from the space's own colour, so adding a space to
// the catalogue needs no new CSS.
const tile = (color) =>
  `linear-gradient(135deg, color-mix(in srgb, ${color} 26%, #0c0c0f), color-mix(in srgb, ${color} 7%, #0c0c0f))`;

const Spaces = ({showToast, setBookingSpaceId}) => {
  const { spaces, degraded, error, loading, live, refresh } = useSpaces();

  const open = (sp) => {
    if (sp.availability === "full" || sp.availability === "unavailable") {
      showToast(`⛔ ${sp.name} is not bookable today`);
      return;
    }
    setBookingSpaceId(sp.id);
  };

  return (
    <div className="fade-in">
      {error && (
        <div style={{padding:"12px 16px",marginBottom:16,background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:10,fontSize:13,color:"var(--red)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <span>⚠ {error}</span>
          <Btn variant="ghost" style={{fontSize:12,padding:"6px 14px"}} onClick={refresh}>Retry</Btn>
        </div>
      )}

      {degraded.length > 0 && (
        <div style={{padding:"10px 14px",marginBottom:16,background:"rgba(232,160,69,.08)",border:"1px solid rgba(232,160,69,.25)",borderRadius:10,fontSize:12,color:"var(--accent)"}}>
          ⚠ Showing the catalogue without live availability — {degraded.join(", ")} unavailable.
        </div>
      )}

      {!loading && !error && (
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <p style={{color:"var(--muted)",fontSize:14}}>
            Pick a space to book it. Seat counts are for today.
          </p>
          <span style={{fontSize:12,color:live?"var(--green)":"var(--muted)",cursor:live?"default":"pointer"}}
            onClick={live?undefined:refresh}>
            {live ? "● live" : "↻ refresh"}
          </span>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:18}}>
        {loading && [0,1,2].map(i=>(
          <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden"}}>
            <Skeleton h={140} style={{borderRadius:0}}/>
            <div style={{padding:16,display:"flex",flexDirection:"column",gap:8}}>
              <Skeleton h={14} w="60%"/><Skeleton h={11} w="80%"/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                <Skeleton h={13} w="30%"/><Skeleton h={18} w="28%" style={{borderRadius:999}}/>
              </div>
            </div>
          </div>
        ))}

        {(spaces ?? []).map((sp,i)=>{
          const state = AVAILABILITY[sp.availability] ?? AVAILABILITY.unknown;
          const bookable = sp.availability === "available" || sp.availability === "filling";
          return (
            <div key={sp.id} className="fade-up" style={{animationDelay:`${i*.08}s`,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden",transition:"all .25s",cursor:bookable?"pointer":"not-allowed"}}
              onMouseEnter={e=>{if(bookable){e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor="var(--muted)"}}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor="var(--border)"}}
              onClick={()=>open(sp)}>

              <div style={{height:140,display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,background:tile(sp.color),position:"relative"}}>
                {sp.icon}
                {!bookable && sp.availability !== "unknown" && (
                  <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"var(--red)",fontWeight:600,letterSpacing:1}}>
                    {sp.availability === "full" ? "FULLY BOOKED" : "UNAVAILABLE"}
                  </div>
                )}
              </div>

              <div style={{padding:16}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15}}>{sp.name}</div>
                <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>
                  {sp.floor} · {sp.capacity} seats · {sp.type}
                </div>

                <div style={{fontSize:12,color:"var(--muted)",marginTop:8}}>
                  {sp.seatsFree == null
                    ? "Availability unknown"
                    : <><strong style={{color:bookable?"var(--text)":"var(--red)"}}>{sp.seatsFree}</strong> of {sp.capacity} seats free today</>}
                </div>
                {sp.seatsFree != null && (
                  <div style={{height:4,background:"var(--surface2)",borderRadius:999,overflow:"hidden",marginTop:6}}>
                    <div style={{height:"100%",width:`${Math.round((sp.seatsTaken/sp.capacity)*100)}%`,background:sp.color,borderRadius:999,transition:"width .8s ease"}}/>
                  </div>
                )}

                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:14}}>
                  <div style={{fontWeight:700,fontSize:14,color:"var(--accent)"}}>{formatINR(sp.price)}/day</div>
                  <Badge type={state.badge}>
                    <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:state.dot,marginRight:5}}/>
                    {state.label}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Spaces;
