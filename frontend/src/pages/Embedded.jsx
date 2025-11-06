// frontend/src/pages/Embedded.tsx
import { useState } from "react";
import { getUserData } from "../utils/utils";
import "./embedded.css";

export default function Embedded() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleAuthenticate = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const userData = await getUserData();
      if (!userData) throw new Error("Failed to get user data");

      // success: SESSION cookie set (overwrites existing)
      setStatus("success");
      setIsLoading(false);

      // open full app in new tab, keep this iframe in place
      const homeUrl = `${window.location.origin}/app/home`;
      window.open(homeUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to get user data:", err);
      const errorMessage =
        err?.response?.error ||
        err?.message ||
        "Failed to authenticate. Please try again.";
      setError(errorMessage);
      setStatus("error");
      setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading;

  let buttonLabel = "Authenticate with GoHighLevel";
  if (isLoading) buttonLabel = "Authenticating...";
  else if (status === "success") buttonLabel = "Re-authenticate";
  else if (status === "error") buttonLabel = "Retry authentication";

  return (
    <div className="sb-embed-root">
      <div className="sb-embed-card">
        <h1 className="sb-embed-title">SmartBuild</h1>
        <p className="sb-embed-subtitle">
          Connect your GoHighLevel account to manage SmartBuild directly from your workspace.
        </p>

        <button
          onClick={handleAuthenticate}
          disabled={isButtonDisabled}
          className={`sb-embed-button ${isButtonDisabled ? "sb-embed-button--disabled" : ""}`}
        >
          {buttonLabel}
        </button>

        {status === "success" && !error && !isLoading && (
          <div className="sb-embed-message sb-embed-message--success">
            Authentication successful. We’ve opened SmartBuild in a new tab.
            Use the button above anytime to re-authenticate.
          </div>
        )}

        {error && (
          <div className="sb-embed-message sb-embed-message--error">
            {error}
          </div>
        )}

        <div className="sb-embed-footnote">
          This page stays inside GoHighLevel so you can quickly refresh your connection
          without leaving the platform.
        </div>
      </div>
    </div>
  );
}
