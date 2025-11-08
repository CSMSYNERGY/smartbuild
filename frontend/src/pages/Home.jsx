import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider";

export default function Home() {
  const { user } = useAuth();

  return (
    <div style={{ padding: 16 }}>
      <h2>User Information</h2>
      {user ? (
        <div style={{ marginTop: "16px" }}>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "16px",
              borderRadius: "8px",
              overflow: "auto",
            }}
          >
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      ) : (
        <p>No user information available</p>
      )}
    </div>
  );
}
