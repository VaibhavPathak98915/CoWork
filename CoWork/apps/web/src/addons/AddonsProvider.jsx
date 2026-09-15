import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const AddonsContext = createContext(null);

export const useAddons = () => {
  const value = useContext(AddonsContext);
  if (!value) throw new Error("useAddons must be used inside <AddonsProvider>");
  return value;
};

/**
 * One source of truth for add-ons, shared by the Services page, the sidebar badge
 * and the payment summary.
 *
 * They used to be three separate hardcoded lists that contradicted each other —
 * the table listed a service the toggles never marked active. Reading them from
 * one place makes that class of disagreement impossible.
 */
export function AddonsProvider({ children }) {
  const [addons, setAddons] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { addons } = await api.addons();
      setAddons(addons);
    } catch (e) {
      setError(e.message);
      setAddons(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /**
   * Flips the card immediately, then reconciles with the server. On failure the
   * optimistic change is rolled back — a card that silently stays "Added" after a
   * failed write would be the same lie we just removed.
   */
  const toggle = useCallback(async (addon) => {
    const wasSubscribed = addon.subscribed;
    setAddons((list) =>
      list.map((a) => (a.id === addon.id ? { ...a, subscribed: !wasSubscribed } : a))
    );
    try {
      if (wasSubscribed) await api.unsubscribeAddon(addon.id);
      else await api.subscribeAddon(addon.id);
      return { ok: true, subscribed: !wasSubscribed };
    } catch (e) {
      setAddons((list) =>
        list.map((a) => (a.id === addon.id ? { ...a, subscribed: wasSubscribed } : a))
      );
      return { ok: false, message: e.message };
    }
  }, []);

  const active = (addons ?? []).filter((a) => a.subscribed);

  return (
    <AddonsContext.Provider value={{ addons, active, error, loading, refresh, toggle }}>
      {children}
    </AddonsContext.Provider>
  );
}
