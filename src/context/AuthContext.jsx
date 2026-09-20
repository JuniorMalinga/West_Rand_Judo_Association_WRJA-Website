import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentSession,
  getProfile,
  signInWithEmail,
  signUpWithEmail,
  signOutCurrentUser,
  subscribeToAuthChanges,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginTransitionId, setLoginTransitionId] = useState(0);

  // 1. Listen for Supabase session and auth state changes.
  // Keep callback synchronous and avoid async database calls inside onAuthStateChange to prevent deadlocks.
  useEffect(() => {
    let isMounted = true;

    // Check for an existing session on startup
    getCurrentSession()
      .then((activeSession) => {
        if (!isMounted) return;
        setSession(activeSession);
        if (!activeSession) {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error restoring session:", error);
        if (isMounted) setLoading(false);
      });

    // Listen for auth events (sign in, sign out, token refresh)
    const subscription = subscribeToAuthChanges((event, nextSession) => {
      if (!isMounted) return;

      setSession(nextSession);

      // If signed out, immediately clear profile and end loading
      if (event === "SIGNED_OUT" || !nextSession?.user) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }
    };
  }, []);

  // 2. Fetch the profile in a separate effect whenever the logged-in user ID changes
  const userId = session?.user?.id;

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    getProfile(userId)
      .then((userProfile) => {
        if (isMounted) setProfile(userProfile);
      })
      .catch((error) => {
        console.error("Error fetching profile:", error);
        if (isMounted) setProfile(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Log in using Supabase Auth and fetch the profile row
  const signIn = async (email, password) => {
    const data = await signInWithEmail(email, password);
    let userProfile = null;

    if (data?.user?.id) {
      userProfile = await getProfile(data.user.id);
    }

    setSession(data.session);
    setProfile(userProfile);
    setLoginTransitionId((current) => current + 1);

    return { session: data.session, user: data.user, profile: userProfile };
  };

  // Register a new user using Supabase Auth
  const signUp = async (userDetails) => {
    return await signUpWithEmail(userDetails);
  };

  // Sign out the current user and clear local React state
  const signOut = async () => {
    await signOutCurrentUser();
    setSession(null);
    setProfile(null);
  };

  const user = session?.user ?? null;

  // Authorization rule: admin access is strictly derived from public.profiles, never from user_metadata.
  // The database role string is "administrator".
  const isAdmin = profile?.role === "administrator" && profile?.isActive !== false;

  const displayName =
    profile?.firstName ||
    user?.user_metadata?.first_name ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    "there";

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      displayName,
      loading,
      isAdmin,
      loginTransitionId,
      signIn,
      signUp,
      signOut,
    }),
    [session, user, profile, displayName, loading, isAdmin, loginTransitionId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

