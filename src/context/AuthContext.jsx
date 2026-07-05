import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth as authApi, users, notifications, setToken, removeToken, getToken, setRefreshToken, registerLogoutCallback } from "../services/api";
import { trackEvent } from "../utils/analytics";

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // true on first mount (checking auth)
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // ── Auth Modal State ──
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalView, setAuthModalView] = useState('login'); // 'login' or 'signup'
    const [isAuthModalPersistent, setIsAuthModalPersistent] = useState(false);

    const openAuthModal = useCallback((view = 'login', persistent = false) => {
        setAuthModalView(view);
        setIsAuthModalOpen(true);
        setIsAuthModalPersistent(persistent);
    }, []);

    const closeAuthModal = useCallback(() => {
        setIsAuthModalOpen(false);
        setIsAuthModalPersistent(false);
    }, []);



    // ── Bootstrap: re-hydrate user from stored token ──
    useEffect(() => {
        const init = async () => {
            if (!getToken()) {
                setLoading(false);
                return;
            }
            try {
                const data = await users.getMyProfile();
                setUser(data);
            } catch {
                removeToken();
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // ── Actions ──

    const login = useCallback(async ({ email, password }) => {
        setError(null);
        const data = await authApi.login({ email, password });
        // The api.js wrapper returns 'data' from { success, message, data }
        // For login, 'data' is { user, accessToken, refreshToken }
        if (data?.accessToken) setToken(data.accessToken);
        if (data?.refreshToken) setRefreshToken(data.refreshToken);
        if (data?.user) setUser(data.user);
        trackEvent("login", { method: "password" });
        return data;
    }, []);

    const register = useCallback(async (formData) => {
        setError(null);
        const data = await authApi.register(formData);
        if (data?.accessToken) setToken(data.accessToken);
        if (data?.refreshToken) setRefreshToken(data.refreshToken);
        if (data?.user) setUser(data.user);
        trackEvent("sign_up", { method: "password" });
        return data;
    }, []);

    const googleAuth = useCallback(async (idToken) => {
        setError(null);
        // Backend now returns tokens in the Google auth response body too,
        // which allows us to set the token in local storage for session rehydration.
        const data = await authApi.googleAuth({ idToken });
        if (data?.accessToken) setToken(data.accessToken);
        if (data?.refreshToken) setRefreshToken(data.refreshToken);
        if (data?.user) setUser(data.user);
        trackEvent("login", { method: "google" });
        return data;
    }, []);

    const logout = useCallback(() => {
        removeToken();
        setUser(null);
    }, []);

    // ── Register global logout callback ──
    useEffect(() => {
        registerLogoutCallback(logout);
        return () => registerLogoutCallback(null);
    }, [logout]);

    const forgotPassword = useCallback(async (email) => {
        return authApi.forgotPassword({ email });
    }, []);

    const resetPassword = useCallback(async ({ token, password }) => {
        return authApi.resetPassword({ token, password });
    }, []);

    const refetchUser = useCallback(async () => {
        try {
            const data = await users.getMyProfile();
            setUser(data);
            return data;
        } catch {
            logout();
        }
    }, [logout]);

    const fetchUnreadCount = useCallback(async () => {
        if (!getToken()) return;
        try {
            const data = await notifications.getUnreadCount();
            setUnreadCount(data.unreadCount);
        } catch (err) {
            console.error("Failed to fetch unread count:", err);
        }
    }, []);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [user, fetchUnreadCount]);

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        unreadCount,
        setUnreadCount,
        fetchUnreadCount,
        login,
        register,
        googleAuth,
        logout,
        forgotPassword,
        resetPassword,
        refetchUser,
        setError,
        isAuthModalOpen,
        authModalView,
        isAuthModalPersistent,
        openAuthModal,
        closeAuthModal,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within <AuthProvider>");
    }
    return ctx;
}
console.log(".");