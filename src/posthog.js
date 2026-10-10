/**
 * PostHog analytics — initialised from VITE_POSTHOG_KEY.
 *
 * If the env var is missing the module is inert: every export is a no-op,
 * so the rest of the app never needs to check whether analytics is live.
 */
import posthog from "posthog-js";

const KEY = import.meta.env.VITE_POSTHOG_KEY || "";
const HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

let ready = false;

export function initPostHog() {
  if (!KEY || ready) return;
  posthog.init(KEY, {
    api_host: HOST,
    autocapture: true,
    capture_pageview: false,   // we fire these manually on route change
    capture_pageleave: true,
    persistence: "localStorage+cookie",
  });
  ready = true;
}

/** Fire a pageview — call on every route change. */
export function capturePageview(path) {
  if (!ready) return;
  posthog.capture("$pageview", { $current_url: window.location.href, path });
}

/** Identify the user after login. */
export function identifyUser(session) {
  if (!ready || !session?.user) return;
  const u = session.user;
  posthog.identify(u.id, {
    email: u.email,
    provider: u.app_metadata?.provider,
    created_at: u.created_at,
  });
}

/** Reset identity on logout. */
export function resetUser() {
  if (!ready) return;
  posthog.reset();
}

/** Track a custom event. */
export function capture(event, properties) {
  if (!ready) return;
  posthog.capture(event, properties);
}

/** Set user properties (e.g. plan, premium status). */
export function setUserProperties(props) {
  if (!ready) return;
  posthog.people.set(props);
}

export default posthog;
