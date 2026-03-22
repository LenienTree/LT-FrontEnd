import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth as authApi, setToken, removeToken, getToken } from "../services/api";

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // true on first mount (checking auth)
    const [error, setError] = useState(null);

    // ── Bootstrap: re-hydrate user from stored token ──
    useEffect(() => {
        const init = async () => {
            if (!getToken()) {
                setLoading(false);
                return;
            }
            try {
                const data = await authApi.getMe();
                // If getMe() succeeded with our updated API wrapper, it returns the user object directly
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
        if (data?.user) setUser(data.user);
        return data;
    }, []);

    const register = useCallback(async (formData) => {
        setError(null);
        const data = await authApi.register(formData);
        if (data?.accessToken) setToken(data.accessToken);
        if (data?.user) setUser(data.user);
        return data;
    }, []);

    const googleAuth = useCallback(async (idToken) => {
        setError(null);
        // Backend strips tokens from the Google auth response body (sets them as
        // HTTP-only cookies instead), so we only need to update the user state.
        const data = await authApi.googleAuth({ idToken });
        if (data?.user) setUser(data.user);
        return data;
    }, []);

    const logout = useCallback(() => {
        removeToken();
        setUser(null);
    }, []);

    const forgotPassword = useCallback(async (email) => {
        return authApi.forgotPassword({ email });
    }, []);

    const resetPassword = useCallback(async ({ token, password }) => {
        return authApi.resetPassword({ token, password });
    }, []);

    const refetchUser = useCallback(async () => {
        try {
            const data = await authApi.getMe();
            setUser(data);
            return data;
        } catch {
            logout();
        }
    }, [logout]);

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        googleAuth,
        logout,
        forgotPassword,
        resetPassword,
        refetchUser,
        setError,
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
