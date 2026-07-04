/**
 * LenientTree API Service
 * Base URL: set via VITE_API_BASE_URL env var (falls back to localhost:5000 for local dev only)
 *
 * This file contains all API calls for the frontend.
 * Admin endpoints are intentionally excluded.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

// ─── Token Helpers ────────────────────────────────────────────────────────────

export const getToken = () => localStorage.getItem("lt_token");
export const setToken = (token) => localStorage.setItem("lt_token", token);
export const getRefreshToken = () => localStorage.getItem("lt_refresh_token");
export const setRefreshToken = (token) => localStorage.setItem("lt_refresh_token", token);
export const removeToken = () => {
  localStorage.removeItem("lt_token");
  localStorage.removeItem("lt_refresh_token");
};

let logoutCallback = null;
export const registerLogoutCallback = (cb) => {
  logoutCallback = cb;
};

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
  if (response.status === 401 && !options._retry && !endpoint.includes("/auth/refresh")) {
    try {
      // Backend sets the new access token as an HTTP-only cookie, and now also
      // returns it in the response body. We store the new access token in localStorage
      // so it stays synchronized with the Authorization header.
      const refreshResult = await auth.refresh();
      if (refreshResult && refreshResult.accessToken) {
        setToken(refreshResult.accessToken);
      }
      if (refreshResult && refreshResult.refreshToken) {
        setRefreshToken(refreshResult.refreshToken);
      }
      return request(endpoint, { ...options, _retry: true });
    } catch (_) {
      removeToken();
      if (logoutCallback) logoutCallback();
    }
  }

  // Parse JSON or throw
  let data;
  const contentType = response.headers.get("content-type") || "";
  try {
    data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch (e) {
    if (e.name === 'SyntaxError') {
      throw new Error("Server connection closed prematurely (unexpected end of JSON input). Check if the backend is running and stable.");
    }
    throw e;
  }

  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `API Error ${response.status}`;
    const error = new Error(message);
    if (data && data.errors) {
      error.errors = data.errors;
    }
    throw error;
  }

  // Handle standard backend wrapper { success, message, data }
  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) {
      const error = new Error(data.message || 'API Error');
      if (data.errors) {
        error.errors = data.errors;
      }
      throw error;
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

// ─── File Upload Helpers ──────────────────────────────────────────────────────

/**
 * Maximum upload size accepted by the API. Matches the backend's Fastify multipart
 * limit (10 MB).
 *
 * IMPORTANT: the reverse proxy (nginx) in front of the API must allow request bodies
 * at least this large via `client_max_body_size`. Nginx defaults to 1 MB and, when a
 * body exceeds it, returns a 413 error page *before* the request reaches the app. That
 * proxy-generated 413 has no CORS headers, so the browser misreports it as
 * "No 'Access-Control-Allow-Origin' header is present" instead of a size error. Keep
 * nginx's limit >= this value (e.g. `client_max_body_size 12M;`).
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Compresses an image file client-side to ensure it is under the Nginx/backend limits
 * and optimizes upload speed/storage.
 * @param {File} file
 * @param {object} options
 * @returns {Promise<File>}
 */
export async function compressImage(file, { maxWidth = 1920, maxHeight = 1080, quality = 0.7, maxSizeBytes = 800 * 1024 } = {}) {
  if (!file.type.startsWith("image/") || file.size <= maxSizeBytes) {
    return file;
  }
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const name = file.name.substring(0, file.name.lastIndexOf(".")) + ".jpg";
            const compressedFile = new File([blob], name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            if (compressedFile.size >= file.size) {
              resolve(file);
            } else {
              resolve(compressedFile);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Build a multipart FormData for a single-file upload, validating the file up-front so
 * an empty/oversized file fails with a clear message instead of a confusing network or
 * (misleading) CORS error.
 * Automatically compresses images that exceed the threshold (800 KB).
 * @param {string} fieldName multipart field name the backend expects
 * @param {File} file
 * @returns {Promise<FormData>}
 */
async function fileForm(fieldName, file) {
  if (!file) throw new Error("No file selected.");
  if (file.size === 0) throw new Error("The selected file is empty.");
  
  let processedFile = file;
  try {
    processedFile = await compressImage(file);
  } catch (e) {
    console.error("Image compression failed, uploading original file", e);
  }

  if (processedFile.size > MAX_UPLOAD_BYTES) {
    const mb = (processedFile.size / (1024 * 1024)).toFixed(1);
    const maxMb = MAX_UPLOAD_BYTES / (1024 * 1024);
    throw new Error(`File is too large (${mb} MB). Maximum allowed size is ${maxMb} MB.`);
  }
  const formData = new FormData();
  formData.append(fieldName, processedFile);
  return formData;
}

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
  refresh: () => {
    const refreshToken = getRefreshToken();
    return post("/api/auth/refresh", { refreshToken });
  },

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
  uploadAvatar: async (file) => post("/api/users/me/avatar", await fileForm("avatar", file)),

  /**
   * Add an image to the user's gallery.
   * @param {File} file
   */
  addGalleryImage: async (file) => post("/api/users/me/gallery", await fileForm("image", file)),

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
  getPublicProfile: (userId) => get(`/api/users/${userId}/public`),
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

  /**
   * Get dynamic stats for an event (funnel/capacity).
   * @param {string} eventId
   */
  getStats: (eventId) => get(`/api/events/${eventId}/stats`),

  /**
   * Get metadata for event social sharing.
   * @param {string} eventId
   */
  getShare: (eventId) => get(`/api/events/${eventId}/share`),

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
   * @param {{ formData?: Record<string, string>, paymentProof?: string, razorpayPaymentId?: string, razorpayOrderId?: string, razorpaySignature?: string }} data
   */
  registerForEvent: (eventId, data = {}) =>
    post(`/api/events/${eventId}/register`, data),

  /**
   * Create a Razorpay order for an event registration.
   * @param {string} eventId
   * @param {{ teamSize: number }} data
   */
  createRazorpayOrder: (eventId, data) =>
    post(`/api/events/${eventId}/create-razorpay-order`, data),

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
  uploadBanner: async (eventId, file) =>
    post(`/api/events/${eventId}/banner`, await fileForm("banner", file)),

  /**
   * Upload the event poster image.
   * @param {string} eventId
   * @param {File} file
   */
  uploadPoster: async (eventId, file) =>
    post(`/api/events/${eventId}/poster`, await fileForm("poster", file)),

  uploadLinkedinPoster: async (eventId, file) =>
    post(`/api/events/${eventId}/linkedin-poster`, await fileForm("poster", file)),

  /**
   * Upload the event UPI QR Code image.
   * @param {string} eventId
   * @param {File} file
   */
  uploadUpiQrCode: async (eventId, file) =>
    post(`/api/events/${eventId}/upi-qr`, await fileForm("file", file)),

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

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = {
  getNotifications: (page = 1, limit = 20) =>
    get(`/api/notifications?page=${page}&limit=${limit}`),
  getUnreadCount: () => get("/api/notifications/unread-count"),
  markRead: (ids) => put("/api/notifications/mark-read", { notificationIds: ids }),
  markAllRead: () => put("/api/notifications/mark-all-read", {}),
  deleteNotification: (id) => del(`/api/notifications/${id}`),
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
   * Issue certificates to multiple participants at once.
   * @param {{ eventId, recipients: { userId, certificateUrl }[] }} data
   */
  bulkIssueCertificates: (data) => post("/api/organizer/certificates/bulk-issue", data),

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
  approveEvent: (id, isFeatured = false, isPremium = false) =>
    put(`/api/admin/events/${id}/approve`, { isFeatured, isPremium }),

  /** PUT /api/admin/events/:id/premium */
  togglePremium: (id, isPremium = false) =>
    put(`/api/admin/events/${id}/premium`, { isPremium }),

  /** PUT /api/admin/events/:id/landing — show/hide event on the landing page */
  toggleShowOnLanding: (id, showOnLanding = false) =>
    put(`/api/admin/events/${id}/landing`, { showOnLanding }),

  /** PUT /api/admin/events/:id/reject */
  rejectEvent: (id, reason) =>
    put(`/api/admin/events/${id}/reject`, { reason }),

  /** PUT /api/admin/events/order */
  updateEventsOrder: (events) => put("/api/admin/events/order", { events }),

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

  /** GET /api/admin/analytics */
  getAnalytics: () => get("/api/admin/analytics"),

  /** GET /api/admin/organizer-requests — only pending (isOrganizer=false) */
  getOrganizerRequests: () => get("/api/admin/organizer-requests"),

  /** GET /api/admin/events — all events, any status */
  getAllEvents: (params = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', params.page);
    if (params.limit) q.set('limit', params.limit);
    if (params.status) q.set('status', params.status);
    if (params.search) q.set('search', params.search);
    const qs = q.toString();
    return get(`/api/admin/events${qs ? `?${qs}` : ''}`);
  },

  /** Approve organizer request: sets isOrganizer = true on the user */
  approveOrganizer: (userId) => put(`/api/admin/users/${userId}/approve-organizer`, {}),

  // Homepage Config admin actions
  homepage: {
    uploadBanner: async (file) => post("/api/homepage/banners", await fileForm("file", file)),
    updateBannerOrder: (id, order) => put(`/api/homepage/banners/${id}`, { order }),
    deleteBanner: (id) => del(`/api/homepage/banners/${id}`),
    uploadCommunityImage: async (file) => post("/api/homepage/community", await fileForm("file", file)),
    updateCommunityImageOrder: (id, order) => put(`/api/homepage/community/${id}`, { order }),
    deleteCommunityImage: (id) => del(`/api/homepage/community/${id}`),
    uploadTestimonialAvatar: async (file) =>
      post("/api/homepage/testimonials/avatar", await fileForm("file", file)),
    addTestimonial: (data) => post("/api/homepage/testimonials", data),
    updateTestimonial: (id, data) => put(`/api/homepage/testimonials/${id}`, data),
    deleteTestimonial: (id) => del(`/api/homepage/testimonials/${id}`),
    updateSectionsOrder: (sections) => put("/api/homepage/sections/order", { sections }),
  }
};

// ─── Public Homepage ───────────────────────────────────────────────────────────

export const homepage = {
  get: () => get("/api/homepage"),
};

// ─── Referral / UTM tracking ────────────────────────────────────────────────────

export const referral = {
  /** Public: record a click on a referral link. Body: { code } */
  trackClick: (code) => post("/api/referral/click", { code }),

  // ── Admin (any event) ──
  admin: {
    listColleges: () => get("/api/referral/admin/colleges"),
    listStudents: (college) =>
      get(`/api/referral/admin/colleges/${encodeURIComponent(college)}/students`),
    /** Generate a referral link for any event, attributed to a student or college */
    generate: (eventId, refereeUserId, college) =>
      post("/api/referral/admin/generate", { eventId, refereeUserId, college }),
    /** Stats for any event */
    getStats: (eventId) => get(`/api/referral/admin/stats/${eventId}`),
    /** Assign a student user to a specific college by email, optionally creating/registering them */
    assignCollege: (email, college, name) =>
      post("/api/referral/admin/assign-college", { email, college, name }),
  },

  // ── Organizer (own events only) ──
  organizer: {
    listEvents: () => get("/api/referral/organizer/events"),
    listColleges: () => get("/api/referral/organizer/colleges"),
    listStudents: (college) =>
      get(`/api/referral/organizer/colleges/${encodeURIComponent(college)}/students`),
    generate: (eventId, refereeUserId, college) =>
      post("/api/referral/organizer/generate", { eventId, refereeUserId, college }),
    getStats: (eventId) => get(`/api/referral/organizer/stats/${eventId}`),
    assignCollege: (email, college, name) =>
      post("/api/referral/organizer/assign-college", { email, college, name }),
  },
};

export const contact = {
  send: (data) => post("/api/contact", data),
};

// ─── Default export (grouped) ─────────────────────────────────────────────────

const api = {
  auth,
  users,
  events,
  bookmarks,
  notifications,
  organizer,
  admin,
  homepage,
  referral,
  contact,
};

export default api;

