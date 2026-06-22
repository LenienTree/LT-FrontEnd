/**
 * Referral / UTM attribution tracker.
 *
 * Flow:
 *  1. A visitor lands on /event/:id?ref=CODE  → captureReferral(eventId, code)
 *     - stores the code (event-scoped) in localStorage so it survives navigation
 *     - fires a single click-track call to the backend (deduped per session)
 *  2. On the registration page → getReferral(eventId) returns the stored code,
 *     which is sent with the registration so the backend can mark a conversion.
 *  3. After a successful registration → clearReferral(eventId).
 *
 * Codes are scoped per-event so a user clicking referral links for multiple
 * events doesn't cross-attribute.
 */
import { referral as referralApi } from "./api";

const keyFor = (eventId) => `lt_ref_${eventId}`;
const clickFlagFor = (eventId, code) => `lt_ref_clicked_${eventId}_${code}`;

/**
 * Persist a referral code for an event and track the click once.
 * Safe to call on every render of the event page — the click is deduped.
 */
export function captureReferral(eventId, code) {
  if (!eventId || !code) return;
  try {
    localStorage.setItem(keyFor(eventId), code);

    // Dedupe click tracking within a browser session so a page refresh
    // doesn't inflate click counts.
    const flag = clickFlagFor(eventId, code);
    if (!sessionStorage.getItem(flag)) {
      sessionStorage.setItem(flag, "1");
      // Fire-and-forget; a failed track must never block the page.
      referralApi.trackClick(code).catch(() => {});
    }
  } catch {
    /* localStorage/sessionStorage unavailable (private mode) — ignore */
  }
}

/** Read the stored referral code for an event (or null). */
export function getReferral(eventId) {
  if (!eventId) return null;
  try {
    return localStorage.getItem(keyFor(eventId)) || null;
  } catch {
    return null;
  }
}

/** Remove the stored referral code once it has been consumed by a registration. */
export function clearReferral(eventId) {
  if (!eventId) return;
  try {
    localStorage.removeItem(keyFor(eventId));
  } catch {
    /* ignore */
  }
}
