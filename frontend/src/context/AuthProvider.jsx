// frontend/src/context/AuthProvider.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { fetchMe, getUserData, setAuthToken } from "../utils/utils";
import LoadingScreen from "../pages/LoadingScreen";
import AuthError from "../pages/AuthError";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, email, locationId, ... }
  const [entitlement, setEntitlement] = useState(null); // { status, subscriptionByThisUser, ... }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  const init = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const isFramed = window.self !== window.top;

      // 1) Try existing token (sessionStorage: CPI_PLUGIN_TOKEN_<locationId>)
      const existing = await fetchMe();
      if (cancelledRef.current) return;

      if (!isFramed) {
        if (existing) {
          setUser(existing.user || existing);
          setEntitlement(existing.entitlement || null);
          setLoading(false);
          return;
        } else {
          throw new Error(
            "Missing reliable authentication source. Please use the navigation bar inside your web page to access the application."
          );
        }
      }

      // 2) Inside iframe: SSO handshake – decrypt, get JWT, store in sessionStorage
      const data = await getUserData();
      if (cancelledRef.current) return;

      if (data.token) {
        setAuthToken(data.token);
      }

      // 3) Load user and entitlement from /api/me (with Authorization header)
      const authed = await fetchMe();
      if (cancelledRef.current) return;

      if (!authed) {
        throw new Error("Session not established after decrypt");
      }

      setUser(authed.user || authed);
      setEntitlement(authed.entitlement || null);
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
    entitlement,
    loading,
    error,
    refreshAuth: init, // Allow components to refresh auth data
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
