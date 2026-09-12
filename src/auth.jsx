import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiUrl } from "./config.js";
import {
  getAccessToken,
  getSupabase,
  resetPassword as startReset,
  signInWithEmail as startEmail,
  signInWithGoogle as startGoogle,
  signOut as startSignOut,
  signUpWithEmail as startSignUp,
} from "./supabase.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    let dead = false;
    let unsub = () => {};

    (async () => {
      try {
        const sb = await getSupabase();
        if (!dead) setConfigured(true);
        const { data } = await sb.auth.getSession();
        if (!dead) setSession(data.session ?? null);
        const { data: sub } = sb.auth.onAuthStateChange((_event, next) => {
          if (dead) return;
          setDenied(false);
          setSession(next);
        });
        unsub = () => sub.subscription.unsubscribe();
      } catch (e) {
        if (!dead) {
          setConfigured(false);
          setSession(null);
          setError(e.message || "Auth is not configured");
        }
      } finally {
        if (!dead) setLoading(false);
      }
    })();

    return () => {
      dead = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setDenied(false);
      setIsPremium(false);
      setPlan(null);
      return;
    }
    let stop = false;
    fetch(apiUrl("/api/me"), {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(async (r) => {
        if (stop) return;
        if (r.status === 403) {
          setDenied(true);
          setIsPremium(false);
          setPlan(null);
        } else {
          setDenied(false);
          const data = await r.json();
          setIsPremium(data.is_premium || false);
          setPlan(data.plan || null);
        }
      })
      .catch(() => {
        setIsPremium(false);
        setPlan(null);
      });
    return () => {
      stop = true;
    };
  }, [session?.access_token]);

  const value = useMemo(() => {
    const user = session?.user || null;
    const meta = user?.user_metadata || {};
    return {
      session,
      user,
      email: user?.email || "",
      name: meta.full_name || meta.name || user?.email || "",
      avatar: meta.avatar_url || meta.picture || "",
      configured,
      loading,
      denied,
      error,
      notice,
      busy,
      isPremium,
      plan,
      signInWithGoogle: async () => {
        setError("");
        setNotice("");
        setBusy(true);
        try {
          await startGoogle();
        } catch (e) {
          setError(e.message || "Google sign-in failed");
        } finally {
          setBusy(false);
        }
      },
      signInWithEmail: async (email, password) => {
        setError("");
        setNotice("");
        setBusy(true);
        try {
          await startEmail(email, password);
        } catch (e) {
          setError(e.message || "Sign in failed");
        } finally {
          setBusy(false);
        }
      },
      signUpWithEmail: async (email, password) => {
        setError("");
        setNotice("");
        setBusy(true);
        try {
          const { needsConfirm } = await startSignUp(email, password);
          if (needsConfirm) {
            setNotice("Check your email to confirm the account, then sign in.");
          }
        } catch (e) {
          setError(e.message || "Sign up failed");
        } finally {
          setBusy(false);
        }
      },
      resetPassword: async (email) => {
        setError("");
        setNotice("");
        setBusy(true);
        try {
          await startReset(email);
          setNotice("Check your email for a password reset link.");
        } catch (e) {
          setError(e.message || "Could not send reset email");
        } finally {
          setBusy(false);
        }
      },
      signOut: async () => {
        setDenied(false);
        setNotice("");
        setIsPremium(false);
        setPlan(null);
        await startSignOut();
        setSession(null);
      },
      upgrade: async (selectedPlan = "monthly") => {
        if (!session?.access_token) return;
        setError("");
        setBusy(true);
        try {
          const r = await fetch(apiUrl("/api/subscription/checkout"), {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ plan: selectedPlan }),
          });
          const data = await r.json();
          if (data.url) {
            window.location.href = data.url;
          } else {
            setError(data.error || "Could not start checkout");
          }
        } catch (e) {
          setError(e.message || "Checkout failed");
        } finally {
          setBusy(false);
        }
      },
      refreshSubscription: async () => {
        if (!session?.access_token) return;
        try {
          const r = await fetch(apiUrl("/api/me"), {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (r.ok) {
            const data = await r.json();
            setIsPremium(data.is_premium || false);
            setPlan(data.plan || null);
          }
        } catch {
          // ignore
        }
      },
      getAccessToken,
    };
  }, [session, configured, loading, denied, error, notice, busy, isPremium, plan]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
