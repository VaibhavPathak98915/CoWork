/* ─────────────── MODAL ─────────────── */
const Modal = ({open, onClose, title, children}) => (
  <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{
    position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,
    display:"flex",alignItems:"center",justifyContent:"center",
    opacity:open?1:0,pointerEvents:open?"all":"none",transition:"opacity .3s"
  }}>
    <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:18,padding:32,width:440,maxWidth:"90vw",transform:open?"scale(1)":"scale(.95)",transition:"transform .3s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
      </div>
      {children}
    </div>
  </div>
);

export default Modal;
