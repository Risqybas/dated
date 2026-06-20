// import { createContext, useContext, useEffect, useRef, useState } from "react";
// import { supabase } from "../lib/supabase";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [session, setSession] = useState(undefined);
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const initialized = useRef(false);

//   async function fetchProfile(userId) {
//     const { data, error } = await supabase
//       .from("profiles")
//       .select("*")
//       .eq("id", userId)
//       .single();
//     if (error) {
//       console.error("[AuthContext] fetchProfile error:", error.message);
//       return null;
//     }
//     return data;
//   }

//   useEffect(() => {
//     // 1. Get session once on mount
//     supabase.auth.getSession().then(async ({ data: { session } }) => {
//       setSession(session);
//       if (session?.user) {
//         const p = await fetchProfile(session.user.id);
//         setProfile(p);
//       }
//       setLoading(false);
//       initialized.current = true;
//     });

//     // 2. Listen for real auth changes only — skip INITIAL_SESSION
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         // Skip initial event — already handled by getSession() above
//         if (!initialized.current) return;

//         if (event === "SIGNED_OUT") {
//           setSession(null);
//           setProfile(null);
//           return;
//         }

//         if (
//           event === "SIGNED_IN" ||
//           event === "TOKEN_REFRESHED" ||
//           event === "USER_UPDATED"
//         ) {
//           setSession(session);
//           if (session?.user) {
//             const p = await fetchProfile(session.user.id);
//             setProfile(p);
//           }
//         }
//       }
//     );

//     return () => subscription.unsubscribe();
//   }, []);

//   async function signOut() {
//     await supabase.auth.signOut();
//   }

//   async function refreshProfile() {
//     if (!session?.user) return;
//     const p = await fetchProfile(session.user.id);
//     setProfile(p);
//   }

//   const value = {
//     session,
//     user:    session?.user ?? null,
//     profile,
//     loading,
//     signOut,
//     refreshProfile,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
//   return ctx;
// }
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [profile, setProfile] = useState(null);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      if (mountedRef.current) setProfile(null);
      return;
    }
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (mountedRef.current) {
        setProfile(error ? null : data);
      }
    } catch {
      if (mountedRef.current) setProfile(null);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // 1. Hydrate session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mountedRef.current) return;
      setSession(s ?? null);
      if (s?.user) fetchProfile(s.user.id);
    });

    // 2. Listen for ALL auth changes, including account switches
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mountedRef.current) return;

        // Always update the session for any event
        setSession(newSession ?? null);

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          // New user might differ from the previous one (account switch)
          if (newSession?.user) {
            fetchProfile(newSession.user.id);
          }
        } else if (event === "SIGNED_OUT") {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.user) await fetchProfile(s.user.id);
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading: session === undefined, // true only during initial hydration
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}