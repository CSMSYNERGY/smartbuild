import React from "react";

export default function AuthError({ error, onRetry }) {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Authentication Error</h1>
      <p style={{ marginBottom: "1.5rem" }}>{error}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#646cff",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}