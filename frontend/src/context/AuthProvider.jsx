// frontend/src/context/AuthProvider.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { fetchMe, getUserData } from "../utils/utils";
import LoadingScreen from "../pages/LoadingScreen";
import AuthError from "../pages/AuthError";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, email, locationId, ... }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  const init = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1) Try existing session (JWT in HttpOnly cookie)
      const existing = await fetchMe();
      if (cancelledRef.current) return;

      if (existing) {
        setUser(existing);
        setLoading(false);
        return;
      }

      // 2) No session: if inside iframe (GHL), try SSO handshake
      const isFramed = window.self !== window.top;

      if (!isFramed) {
        throw new Error("Please use the 'Advanced Configuration' tab from GoHighLevel Marketplace to authenticate.");
      }

      await getUserData();

      // 3) Now session should exist: load user from /api/me
      const authed = await fetchMe();
      if (cancelledRef.current) return;

      if (!authed) {
        throw new Error("Session not established after decrypt");
      }

      setUser(authed);
      setLoading(false);
    } catch (err) {
      if (cancelledRef.current) return;
      console.error("[AuthProvider] init failed", err);
      setError(err.message || "Authentication failed");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    init();
    return () => {
      cancelledRef.current = true;
    };
  }, [init]);

  const value = {
    user,
    loading,
    error,
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <AuthError error={error} onRetry={init} />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
