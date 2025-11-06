export async function getUserData() {
  try {
    const encryptedUserData = await new Promise((resolve) => {
      // Request user data from parent window
      window.parent.postMessage({ message: "REQUEST_USER_DATA" }, "*");

      // Listen for the response
      const messageHandler = ({ data }) => {
        if (data.message === "REQUEST_USER_DATA_RESPONSE") {
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

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    throw error;
  }
}
