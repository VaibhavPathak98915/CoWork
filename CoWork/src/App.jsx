import { useState } from "react";
import AuthScreen from "./pages/AuthScreen.jsx";
import MainApp from "./layout/MainApp.jsx";

/* ═══════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════ */
export default function App() {
  const [user, setUser] = useState(null);

  return user
    ? <MainApp user={user} onLogout={()=>setUser(null)}/>
    : <AuthScreen onAuth={setUser}/>;
}
