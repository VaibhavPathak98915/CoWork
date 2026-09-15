/* ─────────────── SHARED UI PRIMITIVES ─────────────── */
export const Badge = ({type, children}) => {
  const colors = {
    active:  {bg:"rgba(74,222,128,.12)",  color:"#4ade80"},
    pending: {bg:"rgba(232,160,69,.12)",  color:"#e8a045"},
    expired: {bg:"rgba(248,113,113,.12)", color:"#f87171"},
    blue:    {bg:"rgba(96,165,250,.12)",  color:"#60a5fa"},
  };
  const c = colors[type] || colors.active;
  return (
    <span style={{padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:600,background:c.bg,color:c.color}}>
      {children}
    </span>
  );
};

export const Input = ({label, ...props}) => (
  <div style={{marginBottom:16}}>
    {label && <label style={{display:"block",fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>{label}</label>}
    <input style={{width:"100%",padding:"11px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:14,outline:"none",transition:"border-color .2s"}}
      onFocus={e=>e.target.style.borderColor="var(--accent)"}
      onBlur={e=>e.target.style.borderColor="var(--border)"}
      {...props}/>
  </div>
);

export const Select = ({label, options, ...props}) => (
  <div style={{marginBottom:16}}>
    {label && <label style={{display:"block",fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>{label}</label>}
    <select style={{width:"100%",padding:"11px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:14,outline:"none"}} {...props}>
      {options.map(o=><option key={o}>{o}</option>)}
    </select>
  </div>
);

export const Btn = ({variant="primary", style={}, children, ...rest}) => {
  const base = {padding:"10px 22px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,transition:"all .2s",...style};
  const variants = {
    primary: {background:"var(--accent)",color:"#0a0a0a"},
    ghost:   {background:"transparent",color:"var(--muted)",border:"1px solid var(--border)"},
    danger:  {background:"rgba(248,113,113,.15)",color:"var(--red)",border:"1px solid rgba(248,113,113,.3)"},
  };
  return <button style={{...base,...variants[variant]}} {...rest}>{children}</button>;
};

export const Card = ({children, style={}}) => (
  <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:22,...style}}>
    {children}
  </div>
);

export const CardTitle = ({children, action, onAction}) => (
  <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <span>{children}</span>
    {action && <span style={{color:"var(--muted)",fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:400,cursor:"pointer"}} onClick={onAction}>{action}</span>}
  </div>
);
