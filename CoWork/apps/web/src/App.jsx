import AuthScreen from "./pages/AuthScreen.jsx";
import MainApp from "./layout/MainApp.jsx";
import { AuthProvider, useAuth } from "./auth/AuthProvider.jsx";
import { AddonsProvider } from "./addons/AddonsProvider.jsx";

/* ═══════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════ */
function Root() {
  const { user, bootstrapping, logout } = useAuth();

  // Blank rather than the login screen: we don't yet know whether the cookie is
  // valid, and flashing "sign in" at an already-signed-in user looks broken.
  if (bootstrapping) {
    return <div style={{height:"100vh",background:"var(--bg)"}}/>;
  }

  // AddonsProvider sits inside the signed-in branch: it fetches per-user data and
  // has nothing to do until there is a session.
  return user
    ? <AddonsProvider><MainApp user={user} onLogout={logout}/></AddonsProvider>
    : <AuthScreen/>;
}

export default function App() {
  return (
    <AuthProvider>
      <Root/>
    </AuthProvider>
  );
}
