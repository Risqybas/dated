import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { AuthContext } from "../hooks/useAuth";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
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
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mountedRef.current) return;
      setSession(s ?? null);
      if (s?.user) fetchProfile(s.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mountedRef.current) return;
        setSession(newSession ?? null);

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
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
    loading: session === undefined,
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}