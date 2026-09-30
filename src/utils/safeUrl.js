// Returns the URL only if it is an absolute http(s) link, otherwise null.
//
// Links stored on events and profiles are typed in by users (an organiser sets
// an event's registrationLink). window.open / location.replace would execute a
// `javascript:` or `data:` URL on our origin, where the login tokens live, so
// every navigation to a stored URL goes through this check first.
export const safeHttpUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
};
