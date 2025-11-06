import { useState, useEffect } from "react";

export default function Home() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUserInfo(data);
      } catch (err) {
        console.error("Failed to fetch user info:", err);
        setError("Failed to load user information");
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  if (loading) {
    return <div style={{ padding: 16 }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: 16, color: "red" }}>{error}</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>User Information</h2>
      {userInfo ? (
        <div style={{ marginTop: "16px" }}>
          <pre style={{ 
            backgroundColor: "#f5f5f5", 
            padding: "16px", 
            borderRadius: "8px",
            overflow: "auto"
          }}>
            {JSON.stringify(userInfo, null, 2)}
          </pre>
        </div>
      ) : (
        <p>No user information available</p>
      )}
    </div>
  );
}
  