import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);
const TAB_SESSION_KEY = "wrja.auth.tab-session";
const SESSION_ENDED_KEY = "wrja.auth.session-ended";

// What the rest of the app reads from a logged-in person.
function toSession(profile) {
  if (!profile) return null;
  return {
    user: {
      id: profile.id,
      email: profile.email,
      user_metadata: { first_name: profile.firstName, last_name: profile.lastName, full_name: `${profile.firstName} ${profile.lastName}` },
    },
    profile,
  };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, profile: null });
  const [loginTransitionId, setLoginTransitionId] = useState(0);
  const authLoadRef = useRef(null);

  const setProfile = useCallback((profile) => {
    setState({ loading: false, profile });
    window.dispatchEvent(new Event("wrja:auth-changed")); // data stores reload with the new permissions
  }, []);

  // The server is the source of truth; a per-tab marker prevents a new tab
  // from restoring a session cookie shared with other tabs.
  useEffect(() => {
    let cancelled = false;
    if (!authLoadRef.current) {
      authLoadRef.current = (async () => {
        if (!window.sessionStorage.getItem(TAB_SESSION_KEY)) {
          const previousSession = await api("/api/auth/me");
          if (previousSession.user) {
            window.localStorage.setItem(SESSION_ENDED_KEY, `${Date.now()}-${Math.random()}`);
            await api("/api/auth/logout", { method: "POST", body: {} });
          }
          window.sessionStorage.setItem(TAB_SESSION_KEY, "active");
          return null;
        }
        const data = await api("/api/auth/me");
        return data.user;
      })().catch(() => null);
    }
    authLoadRef.current.then((profile) => {
      if (!cancelled) setState({ loading: false, profile });
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleSessionEnded = (event) => {
      if (event.key !== SESSION_ENDED_KEY || !event.newValue) return;
      window.sessionStorage.removeItem(TAB_SESSION_KEY);
      setState({ loading: false, profile: null });
      window.dispatchEvent(new Event("wrja:auth-changed"));
    };
    window.addEventListener("storage", handleSessionEnded);
    return () => window.removeEventListener("storage", handleSessionEnded);
  }, []);

  // The server said our session is gone (expired, or revoked by an admin).
  useEffect(() => {
    const handleExpired = () => {
      setState((current) => {
        if (!current.profile) return current;
        window.setTimeout(() => window.dispatchEvent(new Event("wrja:auth-changed")), 0);
        return { loading: false, profile: null };
      });
    };
    window.addEventListener("wrja:session-expired", handleExpired);
    return () => window.removeEventListener("wrja:session-expired", handleExpired);
  }, []);

  const value = useMemo(() => {
    const session = toSession(state.profile);
    const profile = state.profile;
    return {
      session,
      user: session?.user ?? null,
      profile,
      displayName: profile?.firstName || "there",
      loading: state.loading,
      isAdmin: profile?.role === "admin",
      loginTransitionId,
      signIn: async (email, password) => {
        const data = await api("/api/auth/login", { method: "POST", body: { email, password } });
        window.sessionStorage.setItem(TAB_SESSION_KEY, "active");
        setProfile(data.user);
        setLoginTransitionId((current) => current + 1);
        return toSession(data.user);
      },
      signUp: (details) => api("/api/auth/signup", { method: "POST", body: details }),
      signOut: async () => {
        try {
          window.localStorage.setItem(SESSION_ENDED_KEY, `${Date.now()}-${Math.random()}`);
          await api("/api/auth/logout", { method: "POST", body: {} });
        } finally {
          window.sessionStorage.removeItem(TAB_SESSION_KEY);
          setProfile(null);
        }
      },
    };
  }, [state, loginTransitionId, setProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
