import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  signInWithPassword,
  signOut as authSignOut,
  signUpWithEmail,
  getSession,
  getProfile,
  onAuthStateChange,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginTransitionId, setLoginTransitionId] = useState(0);

  // 1. Initial session retrieval and synchronous auth state listener
  useEffect(() => {
    getSession()
      .then((initialSession) => {
        setSession(initialSession);
        if (!initialSession?.user?.id) {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error retrieving initial session:", err);
        setSession(null);
        setLoading(false);
      });

    // Synchronous auth listener: ONLY sets session state synchronously
    const { data: { subscription } } = onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (!currentSession?.user?.id) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 2. Separate effect watching session user ID changes to load profile
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
        if (isMounted) {
          setProfile(userProfile);
        }
      })
      .catch((err) => {
        console.error("Error fetching profile for user:", err);
        if (isMounted) {
          setProfile(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const value = useMemo(() => {
    // Administrator authorization strictly comes from public.profiles
    const isAdmin = Boolean(
      profile?.role === "administrator" &&
      profile?.isActive !== false
    );

    const sessionWithProfile = session ? { ...session, profile } : null;

    return {
      session: sessionWithProfile,
      user: session?.user ?? null,
      profile,
      displayName:
        profile?.firstName ||
        session?.user?.user_metadata?.first_name ||
        session?.user?.user_metadata?.full_name?.split(" ")[0] ||
        "there",
      loading,
      isAdmin,
      loginTransitionId,

      // Async Supabase sign in
      signIn: async (email, password) => {
        const result = await signInWithPassword(email, password);
        setSession(result.session);
        setProfile(result.profile);
        setLoginTransitionId((current) => current + 1);
        return {
          ...result.session,
          session: result.session,
          user: result.user,
          profile: result.profile,
        };
      },

      // Async Supabase sign out
      signOut: async () => {
        try {
          await authSignOut();
        } catch (err) {
          console.error("Sign out error:", err);
        } finally {
          setSession(null);
          setProfile(null);
        }
      },

      // Async Supabase sign up
      signUp: async (userDetails) => {
        return await signUpWithEmail(userDetails);
      },

      // TEMPORARY OUT-OF-SCOPE COMPATIBILITY:
      // Preserved to prevent crash until their phase is implemented.
      // Must throw an Error so UI does not pretend an unintegrated action succeeded.
      users: [],
      createUser: () => {
        throw new Error("User creation has not yet been connected to Supabase.");
      },
      updateUser: () => {
        throw new Error("User update has not yet been connected to Supabase.");
      },
      deleteUser: () => {
        throw new Error("User deletion has not yet been connected to Supabase.");
      },
    };
  }, [loading, loginTransitionId, profile, session]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
