import { Badge, Btn, Card, CardTitle } from "../components/ui.jsx";

/* ═══════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════ */
const Dashboard = ({showToast}) => {
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
          <CardTitle action="View all →" onAction={()=>showToast("📅 Booking history opened")}>Recent Bookings</CardTitle>
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

export default Dashboard;
