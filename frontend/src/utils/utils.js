export async function getUserData() {
  try {
    const encryptedUserData = await new Promise((resolve, reject) => {
      const TIMEOUT_MS = 5000; // 5 seconds timeout

      // Request user data from parent window
      window.parent.postMessage({ message: "REQUEST_USER_DATA" }, "*");

      // Set up timeout
      const timeoutId = setTimeout(() => {
        window.removeEventListener("message", messageHandler);
        reject(new Error("Timeout: Parent window did not respond"));
      }, TIMEOUT_MS);

      // Listen for the response
      const messageHandler = ({ data }) => {
        if (data.message === "REQUEST_USER_DATA_RESPONSE") {
          clearTimeout(timeoutId);
          window.removeEventListener("message", messageHandler);
          resolve(data.payload);
        }
      };

      window.addEventListener("message", messageHandler);
    });

    // Send encrypted data to your backend for decryption
    const response = await fetch("/api/sso/decrypt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ encryptedData: encryptedUserData }),
      credentials: "include",
    });

    const data = await response.json();

    // Check if response contains an error
    if (!response.ok || data.error) {
      const error = new Error(data.error || "Failed to authenticate");
      error.response = data; // Attach full response for error handling
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    throw error;
  }
}

export async function fetchMe() {
  const res = await fetch("/api/me", {
    method: "GET",
    credentials: "include",
  });
  return res.ok ? res.json() : null;
}
