/**
 * LenientTree API Service
 * Base URL: http://localhost:5000
 *
 * This file contains all API calls for the frontend.
 * Admin endpoints are intentionally excluded.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ─── Token Helpers ────────────────────────────────────────────────────────────

export const getToken = () => localStorage.getItem("lt_token");
export const setToken = (token) => localStorage.setItem("lt_token", token);
export const removeToken = () => localStorage.removeItem("lt_token");

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

/**
 * Core request helper.
 * Automatically attaches Authorization header if a token exists.
 * Handles 401 → tries to refresh once → retries.
 */
async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // for refresh-token cookie if server uses one
  });

  // Auto-refresh on 401
  if (response.status === 401 && !options._retry) {
    try {
      // Backend sets the new access token as an HTTP-only cookie (body is null).
      // We just need to trigger the refresh call — the cookie is updated automatically.
      await auth.refresh();
      return request(endpoint, { ...options, _retry: true });
    } catch (_) {
      removeToken();
    }
  }

  // Parse JSON or throw
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `API Error ${response.status}`;
    throw new Error(message);
  }

  // Handle standard backend wrapper { success, message, data }
  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) {
      throw new Error(data.message || 'API Error');
    }
    // Return the payload
    return data.data !== undefined ? data.data : data;
  }

  return data;
}

// Convenience shorthands
const get = (url, opts) => request(url, { method: "GET", ...opts });
const post = (url, body, opts) =>
  request(url, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...opts,
  });
const put = (url, body, opts) =>
  request(url, {
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...opts,
  });
const del = (url, opts) => request(url, { method: "DELETE", ...opts });

// ─── Auth Endpoints ───────────────────────────────────────────────────────────

export const auth = {
  /**
   * Register a new user account.
   * @param {{ name, email, password, phone, college, graduationYear }} data
   */
  register: (data) => post("/api/auth/register", data),

  /**
   * Login with email and password.
   * @param {{ email, password }} data
   * @returns {{ token, user }}
   */
  login: (data) => post("/api/auth/login", data),

  /**
   * Login with Google ID token (Firebase / Google OAuth).
   * @param {{ idToken: string }} data
   * @returns {{ token, user }}
   */
  googleAuth: (data) => post("/api/auth/google", data),

  /**
   * Refresh the access token using the stored refresh token cookie.
   * @returns {{ token }}
   */
  refresh: () => post("/api/auth/refresh", {}),

  /**
   * Send forgot-password email.
   * @param {{ email }} data
   */
  forgotPassword: (data) => post("/api/auth/forgot-password", data),

  /**
   * Reset password using the link token.
   * @param {{ token, password }} data
   */
  resetPassword: (data) => post("/api/auth/reset-password", data),

  /**
   * Verify email using token from the verification link.
   * @param {string} token
   */
  verifyEmail: (token) => get(`/api/auth/verify-email?token=${token}`),

  /**
   * Get the currently authenticated user (auth-check).
   * @returns {User}
   */
  getMe: () => get("/api/auth/me"),
};

// ─── User Endpoints ───────────────────────────────────────────────────────────

export const users = {
  /**
   * Get the logged-in user's full profile.
   * @returns {User}
   */
  getMyProfile: () => get("/api/users/me"),

  /**
   * Update the logged-in user's profile.
   * @param {{ name?, phone?, college?, graduationYear?, bio?, skills?, socialLinks? }} data
   */
  updateMyProfile: (data) => put("/api/users/me", data),

  /**
   * Get all events the logged-in user has registered for.
   * @returns {Registration[]}
   */
  getMyRegisteredEvents: () => get("/api/users/me/events"),

  /**
   * Get all certificates earned by the logged-in user.
   * @returns {Certificate[]}
   */
  getMyCertificates: () => get("/api/users/me/certificates"),

  /**
   * Upload avatar image.
   * @param {File} file
   */
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return post("/api/users/me/avatar", formData);
  },

  /**
   * Add an image to the user's gallery.
   * @param {File} file
   */
  addGalleryImage: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return post("/api/users/me/gallery", formData);
  },

  /**
   * Delete an image from the user's gallery.
   * @param {string} imageId
   */
  deleteGalleryImage: (imageId) => del(`/api/users/me/gallery/${imageId}`),

  /**
   * Change the user's password.
   * @param {{ currentPassword, newPassword, confirmPassword }} data
   */
  changePassword: (data) => put("/api/users/me/password", data),

  /**
   * Upgrade current user to organizer role.
   */
  becomeOrganizer: (data) => post("/api/users/me/become-organizer", data || {}),

  /**
   * Get any public user's profile by ID.
   * @param {string} userId
   * @returns {User}
   */
  getUserById: (userId) => get(`/api/users/${userId}`),
};

// ─── Events – Public / Discovery ─────────────────────────────────────────────

export const events = {
  /**
   * Fetch paginated and filtered list of events.
   * @param {{ category?, mode?, month?, page?, limit? }} params
   */
  getAll: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return get(`/api/events${query ? `?${query}` : ""}`);
  },

  /**
   * Get full details of a single event.
   * @param {string} eventId
   */
  getById: (eventId) => get(`/api/events/${eventId}`),

  /**
   * Get the announcements for an event (public).
   * @param {string} eventId
   */
  getAnnouncements: (eventId) => get(`/api/events/${eventId}/announcements`),

  /**
   * Get the FAQs for an event (public).
   * @param {string} eventId
   */
  getFAQs: (eventId) => get(`/api/events/${eventId}/faqs`),

  // ── Participant Operations ──

  /**
   * Check if the current user is registered for an event.
   * @param {string} eventId
   * @returns {{ isRegistered, status }}
   */
  checkRegistrationStatus: (eventId) =>
    get(`/api/events/${eventId}/registration-status`),

  /**
   * Register the current user for an event.
   * @param {string} eventId
   * @param {{ formData?: Record<string, string> }} data
   */
  registerForEvent: (eventId, data = {}) =>
    post(`/api/events/${eventId}/register`, data),

  // ── Organizer Operations ──

  /**
   * Create event draft (Step 1 of event creation).
   * @param {{ title, subtitle, category, mode, startDate, endDate, registrationDeadline, description, prizeType, prizeAmount, isPaid }} data
   * @returns {{ eventId }}
   */
  createDraft: (data) => post("/api/events", data),

  /**
   * Update event design and config (Step 2).
   * @param {string} eventId
   * @param {{ maxParticipants?, approvalMode?, designConfig?, customFormFields? }} data
   */
  updateDesign: (eventId, data) => put(`/api/events/${eventId}/design`, data),

  /**
   * Submit event for admin approval (Step 3).
   * @param {string} eventId
   */
  submitForApproval: (eventId) =>
    post(`/api/events/${eventId}/submit`, {}),

  /**
   * General update of any event fields.
   * @param {string} eventId
   * @param {object} data
   */
  update: (eventId, data) => put(`/api/events/${eventId}`, data),

  /**
   * Upload the event banner image.
   * @param {string} eventId
   * @param {File} file
   */
  uploadBanner: (eventId, file) => {
    const formData = new FormData();
    formData.append("banner", file);
    return post(`/api/events/${eventId}/banner`, formData);
  },

  /**
   * Upload the event poster image.
   * @param {string} eventId
   * @param {File} file
   */
  uploadPoster: (eventId, file) => {
    const formData = new FormData();
    formData.append("poster", file);
    return post(`/api/events/${eventId}/poster`, formData);
  },

  /**
   * Delete an event (organizer).
   * @param {string} eventId
   */
  deleteEvent: (eventId) => del(`/api/events/${eventId}`),

  /**
   * Get registered participants for an event (organizer).
   * @param {string} eventId
   */
  getParticipants: (eventId) => get(`/api/events/${eventId}/participants`),

  // ── Management: Announcements ──

  /**
   * Create an announcement for an event.
   * @param {string} eventId
   * @param {{ title, content }} data
   */
  createAnnouncement: (eventId, data) =>
    post(`/api/events/${eventId}/announcements`, data),

  /**
   * Update an announcement.
   * @param {string} eventId
   * @param {string} announcementId
   * @param {{ title?, content? }} data
   */
  updateAnnouncement: (eventId, announcementId, data) =>
    put(`/api/events/${eventId}/announcements/${announcementId}`, data),

  /**
   * Delete an announcement.
   * @param {string} eventId
   * @param {string} announcementId
   */
  deleteAnnouncement: (eventId, announcementId) =>
    del(`/api/events/${eventId}/announcements/${announcementId}`),

  // ── Management: FAQs ──

  /**
   * Create a FAQ for an event.
   * @param {string} eventId
   * @param {{ question, answer, order? }} data
   */
  createFAQ: (eventId, data) => post(`/api/events/${eventId}/faqs`, data),

  /**
   * Update a FAQ.
   * @param {string} eventId
   * @param {string} faqId
   * @param {{ question?, answer? }} data
   */
  updateFAQ: (eventId, faqId, data) =>
    put(`/api/events/${eventId}/faqs/${faqId}`, data),

  /**
   * Delete a FAQ.
   * @param {string} eventId
   * @param {string} faqId
   */
  deleteFAQ: (eventId, faqId) => del(`/api/events/${eventId}/faqs/${faqId}`),

  // ── Registration Management (Organizer) ──

  /**
   * Approve a registration.
   * @param {string} eventId
   * @param {string} registrationId
   */
  approveRegistration: (eventId, registrationId) =>
    put(`/api/events/${eventId}/registrations/${registrationId}/approve`, {}),

  /**
   * Reject a registration.
   * @param {string} eventId
   * @param {string} registrationId
   */
  rejectRegistration: (eventId, registrationId) =>
    put(`/api/events/${eventId}/registrations/${registrationId}/reject`, {}),

  /**
   * Mark a registration as attended.
   * @param {string} eventId
   * @param {string} registrationId
   */
  markAttendance: (eventId, registrationId) =>
    put(`/api/events/${eventId}/registrations/${registrationId}/attend`, {}),
};

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export const bookmarks = {
  /**
   * Toggle bookmark for an event.
   * @param {string} eventId
   * @returns {{ bookmarked: boolean }}
   */
  toggle: (eventId) => post(`/api/bookmarks/${eventId}/toggle`, {}),

  /**
   * Get all bookmarked events for the logged-in user.
   * @returns {Event[]}
   */
  getAll: () => get("/api/bookmarks"),
};

// ─── Organizer ────────────────────────────────────────────────────────────────

export const organizer = {
  /**
   * Get the organizer's dashboard (summary of their events, stats, etc.)
   * @returns {OrganizerDashboard}
   */
  getDashboard: () => get("/api/organizer/dashboard"),

  /**
   * Issue a certificate to a participant.
   * @param {{ userId, eventId, certificateUrl }} data
   */
  issueCertificate: (data) => post("/api/organizer/certificates/issue", data),

  /**
   * Get all certificates issued by the organizer.
   * @returns {Certificate[]}
   */
  getIssuedCertificates: () => get("/api/organizer/certificates"),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const admin = {
  /** GET /api/admin/dashboard → { stats, recentEvents, recentUsers } */
  getDashboard: () => get("/api/admin/dashboard"),

  /** GET /api/admin/pending-events */
  getPendingEvents: (page = 1, limit = 10) =>
    get(`/api/admin/pending-events?page=${page}&limit=${limit}`),

  /** PUT /api/admin/events/:id/approve */
  approveEvent: (id, isFeatured = false) =>
    put(`/api/admin/events/${id}/approve`, { isFeatured }),

  /** PUT /api/admin/events/:id/reject */
  rejectEvent: (id, reason) =>
    put(`/api/admin/events/${id}/reject`, { reason }),

  /** GET /api/admin/users */
  getUsers: (page = 1, limit = 10, search = "") =>
    get(`/api/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),

  /** PUT /api/admin/users/:id/block */
  blockUser: (id) => put(`/api/admin/users/${id}/block`, {}),

  /** PUT /api/admin/users/:id/unblock */
  unblockUser: (id) => put(`/api/admin/users/${id}/unblock`, {}),

  /** DELETE /api/admin/users/:id */
  deleteUser: (id) => del(`/api/admin/users/${id}`),

  /** GET /api/admin/audit-logs */
  getAuditLogs: (page = 1, limit = 20) =>
    get(`/api/admin/audit-logs?page=${page}&limit=${limit}`),

  /** GET /api/admin/organizer-requests — only pending (isOrganizer=false) */
  getOrganizerRequests: () => get("/api/admin/organizer-requests"),

  /** Approve organizer request: sets isOrganizer = true on the user */
  approveOrganizer: (userId) => put(`/api/admin/users/${userId}/approve-organizer`, {}),
};

// ─── Default export (grouped) ─────────────────────────────────────────────────

const api = {
  auth,
  users,
  events,
  bookmarks,
  organizer,
  admin,
};

export default api;
