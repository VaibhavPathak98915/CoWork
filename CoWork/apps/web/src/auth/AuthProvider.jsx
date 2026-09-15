import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // True until we've asked the server whether an existing cookie is still valid,
  // so a refresh doesn't flash the login screen before restoring the session.
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.me()
      .then(({ user }) => { if (!cancelled) setUser(user); })
      .catch(() => {})                       // 401 simply means "not signed in"
      .finally(() => { if (!cancelled) setBootstrapping(false); });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (credentials) => {
    const { user } = await api.login(credentials);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (details) => {
    const { user } = await api.register(details);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);   // drop the local session even if the call failed
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, bootstrapping, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
