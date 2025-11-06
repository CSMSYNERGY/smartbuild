import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../utils/utils";

export default function Embedded() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();

  const handleGetUserData = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const userData = await getUserData();
      if (!userData) {
        throw new Error("Failed to get user data");
      }
      
      startTransition(() => {
        navigate("/home", { replace: true });
      });
    } catch (err) {
      console.error("Failed to get user data:", err);
      setError("Failed to authenticate. Please try again.");
      setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || isPending;

  return (
    <div
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <h2>SmartBuild Integration</h2>
      <button
        onClick={handleGetUserData}
        disabled={isButtonDisabled}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          backgroundColor: "#646cff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: isButtonDisabled ? "not-allowed" : "pointer",
          opacity: isButtonDisabled ? 0.6 : 1,
          transition: "opacity 0.2s ease",
        }}
      >
        {isButtonDisabled ? "Authenticating..." : "Authenticate with GoHighLevel"}
      </button>
      {error && <div style={{ marginTop: "16px", color: "red" }}>{error}</div>}
    </div>
  );
}
