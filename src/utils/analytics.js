/**
 * Google Analytics 4 (gtag.js) integration.
 *
 * Driven entirely by the VITE_GA_MEASUREMENT_ID env var:
 *  - When it is unset (e.g. local dev), every function here is a no-op, so no
 *    data is sent and no network request is made.
 *  - When it is set to a GA4 Measurement ID (e.g. "G-XXXXXXXXXX"), gtag.js is
 *    loaded once and page views are tracked manually on SPA route changes.
 *
 * Because this is a single-page app, GA's automatic page_view is disabled and
 * we emit one page_view per client-side navigation (including the first load)
 * — otherwise only the initial HTML load would ever be counted.
 */

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let initialized = false;

/** True when a Measurement ID is configured (analytics active). */
export const isAnalyticsEnabled = () => Boolean(MEASUREMENT_ID);

/**
 * Load gtag.js and initialize GA4.
 * Idempotent (safe to call more than once) and a full no-op when no
 * Measurement ID is configured.
 */
export function initGA() {
  if (initialized || !MEASUREMENT_ID || typeof window === "undefined") return;
  initialized = true;

  // Inject the async gtag.js loader.
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Standard gtag bootstrap. gtag() pushes onto dataLayer immediately; the
  // async script above drains the queue once it finishes loading, so commands
  // issued before load are not lost.
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  // send_page_view: false — we drive page_view manually per route change below.
  gtag("config", MEASUREMENT_ID, { send_page_view: false });
}

/**
 * Record a single-page-app page view.
 * @param {string} path e.g. "/event/123?ref=abc"
 */
export function trackPageView(path) {
  if (!MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/**
 * Record a custom event.
 * @param {string} name   GA4 event name, e.g. "sign_up", "event_register"
 * @param {object} params event parameters, e.g. { method: "google" }
 *
 * Example:
 *   import { trackEvent } from "@/utils/analytics";
 *   trackEvent("event_register", { event_id: eventId, is_paid: true });
 */
export function trackEvent(name, params = {}) {
  if (!MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}
