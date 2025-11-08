import React from "react";

export default function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          backgroundColor: "#ffffff",
          boxShadow: "0 14px 40px rgba(15,23,42,0.16)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          maxWidth: 340,
          width: "100%",
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "999px",
            border: "3px solid #e5e7eb",
            borderTopColor: "#6366f1",
            animation: "sb-spin 0.7s linear infinite",
          }}
        />
        <div
          style={{
            fontSize: 14,
            color: "#111827",
            fontWeight: 500,
          }}
        >
          Connecting SmartBuild…
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          Please wait while we verify your GoHighLevel session.
        </div>
      </div>

      <style>
        {`
          @keyframes sb-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
