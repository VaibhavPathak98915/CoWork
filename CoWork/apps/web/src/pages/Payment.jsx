import { useState } from "react";
import { Btn, Card, CardTitle, Input, Select } from "../components/ui.jsx";
import { usePlans } from "../hooks/usePlans.js";
import { formatINR } from "../lib/format.js";

/** Fixed extras for now — making add-ons selectable is a separate job. */
const ADDONS = [
  { label: "Food Add-on", amount: 250 },
  { label: "Secure Locker", amount: 500 },
  { label: "🎉 Member Discount", amount: -250 },
];

/* ═══════════════════════════════════════════
   PAYMENT
═══════════════════════════════════════════ */
const Payment = ({showToast, selectedPlanId}) => {
  const [method, setMethod] = useState("Card");
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({name:"",card:"",expiry:"",cvv:"",upi:""});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const { plans, loading } = usePlans();

  // Arriving from the sidebar rather than "Select Plan" means nothing was
  // chosen; fall back to the featured plan rather than showing an empty bill.
  const plan = plans?.find((p) => p.id === selectedPlanId)
    ?? plans?.find((p) => p.featured)
    ?? plans?.[0];

  const lines = plan ? [{ label: `${plan.name} Plan`, amount: plan.price }, ...ADDONS] : [];
  const total = lines.reduce((sum, l) => sum + l.amount, 0);

  const handlePay = () => {
    setDone(true);
    showToast(`✅ Payment of ${formatINR(total)} successful!`);
  };

  if(done) return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:20}}>
      <div style={{fontSize:72}} className="float">✅</div>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800}}>Payment Successful!</div>
      <div style={{color:"var(--muted)",fontSize:14}}>
        {formatINR(total)} · {plan?.name} Plan · billed {plan?.period === "day" ? "daily" : plan?.period === "month" ? "monthly" : "yearly"}
      </div>
      <Btn onClick={()=>setDone(false)}>Make Another Payment</Btn>
    </div>
  );

  return (
    <div className="fade-in" style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:24}}>
      <div>
        <Card style={{marginBottom:20}}>
          <CardTitle>Payment Method</CardTitle>
          <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            {[{id:"Card",label:"💳 Card"},{id:"UPI",label:"📱 UPI"},{id:"Net Banking",label:"🏦 Net Banking"},{id:"Wallet",label:"💰 Wallet"}].map(m=>(
              <button key={m.id} onClick={()=>setMethod(m.id)}
                style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${method===m.id?"var(--accent)":"var(--border)"}`,background:method===m.id?"rgba(232,160,69,.08)":"var(--surface2)",color:method===m.id?"var(--accent)":"var(--muted)",fontSize:12,cursor:"pointer",transition:"all .2s",fontFamily:"'DM Sans',sans-serif"}}>
                {m.label}
              </button>
            ))}
          </div>

          {method==="Card"&&(
            <>
              <Input label="Cardholder Name" placeholder="Rahul Sharma" value={form.name} onChange={e=>set("name",e.target.value)}/>
              <Input label="Card Number" placeholder="4242 4242 4242 4242" value={form.card} onChange={e=>set("card",e.target.value)}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Input label="Expiry" placeholder="MM/YY" value={form.expiry} onChange={e=>set("expiry",e.target.value)}/>
                <Input label="CVV" placeholder="•••" type="password" value={form.cvv} onChange={e=>set("cvv",e.target.value)}/>
              </div>
            </>
          )}
          {method==="UPI"&&<Input label="UPI ID" placeholder="name@upi" value={form.upi} onChange={e=>set("upi",e.target.value)}/>}
          {method==="Net Banking"&&<Select label="Select Bank" options={["SBI","HDFC","ICICI","Axis","Kotak","Other"]}/>}
          {method==="Wallet"&&<Select label="Select Wallet" options={["Paytm","PhonePe","Amazon Pay","MobiKwik"]}/>}

          <button onClick={handlePay}
            style={{width:"100%",padding:14,borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,background:"var(--accent)",color:"#0a0a0a",marginTop:4,transition:"all .2s"}}
            onMouseEnter={e=>e.target.style.background="#f0b055"}
            onMouseLeave={e=>e.target.style.background="var(--accent)"}>
            {loading ? "Loading…" : `Pay ${formatINR(total)} →`}
          </button>
        </Card>
      </div>

      <div>
        <div style={{background:"var(--surface2)",borderRadius:12,padding:22,border:"1px solid var(--border)",marginBottom:16}}>
          <CardTitle>Order Summary</CardTitle>
          {loading && <div style={{fontSize:13,color:"var(--muted)",padding:"8px 0"}}>Loading plan…</div>}
          {lines.map((l,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"8px 0",borderBottom:"1px solid var(--border)",color:l.amount<0?"var(--green)":"var(--text)"}}>
              <span style={{color:"var(--muted)"}}>{l.label}</span>
              <span>{l.amount < 0 ? `– ${formatINR(Math.abs(l.amount))}` : formatINR(l.amount)}</span>
            </div>
          ))}
          <div style={{height:1,background:"var(--border)",margin:"12px 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15,color:"var(--accent)"}}>
            <span>Total</span><span>{formatINR(total)}</span>
          </div>
        </div>
        <Card style={{background:"linear-gradient(145deg,#1a1408,var(--surface))"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{fontSize:32}}>⭐</div>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>Gold Member</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>You'll earn {Math.round(total/100)} pts for this purchase</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Payment;
