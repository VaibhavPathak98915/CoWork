import AuthScreen from "./pages/AuthScreen.jsx";
import MainApp from "./layout/MainApp.jsx";
import { AuthProvider, useAuth } from "./auth/AuthProvider.jsx";

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

  return user ? <MainApp user={user} onLogout={logout}/> : <AuthScreen/>;
}

export default function App() {
  return (
    <AuthProvider>
      <Root/>
    </AuthProvider>
  );
}
