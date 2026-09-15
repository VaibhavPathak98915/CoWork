/* ─────────────── TOAST ─────────────── */
const Toast = ({msg, visible}) => (
  <div style={{
    position:"fixed",bottom:28,right:28,
    background:"var(--surface)",border:`1px solid var(--green)`,
    color:"var(--green)",padding:"12px 20px",borderRadius:10,
    fontSize:13,fontWeight:500,zIndex:999,
    transform:visible?"translateY(0)":"translateY(80px)",
    opacity:visible?1:0,transition:"all .4s",pointerEvents:"none"
  }}>{msg}</div>
);

export default Toast;
