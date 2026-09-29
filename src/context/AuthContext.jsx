import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

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

  const setProfile = useCallback((profile) => {
    setState({ loading: false, profile });
    window.dispatchEvent(new Event("wrja:auth-changed")); // data stores reload with the new permissions
  }, []);

  // Who am I? Asked of the server on every page load – nothing about login
  // lives in the browser's storage.
  useEffect(() => {
    let cancelled = false;
    api("/api/auth/me")
      .then((data) => { if (!cancelled) setState({ loading: false, profile: data.user }); })
      .catch(() => { if (!cancelled) setState({ loading: false, profile: null }); });
    return () => { cancelled = true; };
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
        setProfile(data.user);
        setLoginTransitionId((current) => current + 1);
        return toSession(data.user);
      },
      signUp: (details) => api("/api/auth/signup", { method: "POST", body: details }).then((data) => data.user),
      signOut: async () => {
        try {
          await api("/api/auth/logout", { method: "POST", body: {} });
        } finally {
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
