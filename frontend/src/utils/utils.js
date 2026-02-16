const TOKEN_KEY = "CPI_PLUGIN_TOKEN";

/**
 * Get the JWT from sessionStorage.
 * Single key per tab; sessionStorage is not shared across tabs.
 */
export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Store JWT in sessionStorage (key: CPI_PLUGIN_TOKEN).
 */
export function setAuthToken(token) {
  if (!token) return;
  sessionStorage.setItem(TOKEN_KEY, token);
}

/**
 * Clear stored token (e.g. on logout).
 */
export function clearAuthToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

/**
 * Fetch with Authorization: Bearer <token> for API requests.
 * Use for all /api/* calls that require auth.
 */
export function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, {
    ...options,
    headers,
    credentials: "omit",
  });
}

export async function getUserData() {
  try {
    const encryptedUserData = await new Promise((resolve, reject) => {
      const TIMEOUT_MS = 5000;

      window.parent.postMessage({ message: "REQUEST_USER_DATA" }, "*");

      const timeoutId = setTimeout(() => {
        window.removeEventListener("message", messageHandler);
        reject(new Error("Timeout: Parent window did not respond"));
      }, TIMEOUT_MS);

      const messageHandler = ({ data }) => {
        if (data.message === "REQUEST_USER_DATA_RESPONSE") {
          clearTimeout(timeoutId);
          window.removeEventListener("message", messageHandler);
          resolve(data.payload);
        }
      };

      window.addEventListener("message", messageHandler);
    });

    const response = await fetch("/api/sso/decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encryptedData: encryptedUserData }),
      credentials: "omit",
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const error = new Error(data.error || "Failed to authenticate");
      error.response = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    throw error;
  }
}

export async function fetchMe() {
  const res = await fetchWithAuth("/api/me", { method: "GET" });
  return res.ok ? res.json() : null;
}
