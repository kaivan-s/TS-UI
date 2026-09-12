import { createClient } from "@supabase/supabase-js";
import { apiUrl } from "./config.js";

let client = null;
let clientPromise = null;

export async function getSupabase() {
  if (client) return client;
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    let url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
    let anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
    if (!url || !anonKey) {
      try {
        const r = await fetch(apiUrl("/api/auth/config"), {
          signal: AbortSignal.timeout(2500),
        });
        const cfg = await r.json().catch(() => ({}));
        url = url || cfg.url || "";
        anonKey = anonKey || cfg.anonKey || "";
      } catch {
        /* backend not serving auth config yet */
      }
    }
    if (!url || !anonKey) {
      throw new Error(
        "Add the Supabase publishable/anon key as SUPABASE_ANON_KEY in backend/.env (or VITE_SUPABASE_ANON_KEY in ui/.env).",
      );
    }
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return client;
  })();

  try {
    return await clientPromise;
  } catch (e) {
    clientPromise = null;
    throw e;
  }
}

export async function getAccessToken() {
  try {
    const sb = await getSupabase();
    const { data } = await sb.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

export async function signInWithGoogle() {
  const sb = await getSupabase();
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
}

export async function signInWithEmail(email, password) {
  const sb = await getSupabase();
  const { error } = await sb.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
}

export async function signUpWithEmail(email, password) {
  const sb = await getSupabase();
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
  return { needsConfirm: !data.session };
}

export async function resetPassword(email) {
  const sb = await getSupabase();
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

export async function signOut() {
  try {
    const sb = await getSupabase();
    await sb.auth.signOut();
  } catch {
    /* still drop the local client session below */
  }
}
