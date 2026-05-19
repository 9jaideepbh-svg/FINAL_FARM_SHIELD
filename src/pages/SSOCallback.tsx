import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";

/**
 * SSOCallback — landing page after Google OAuth redirect.
 * Clerk processes the OAuth token and then we redirect home.
 */
export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    handleRedirectCallback({
      afterSignInUrl: "/",
      afterSignUpUrl: "/",
    }).catch(() => navigate("/auth"));
  }, [handleRedirectCallback, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "Inter, sans-serif",
        fontSize: "16px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ marginBottom: "16px", fontSize: "32px" }}>🌿</div>
        <div>Completing sign in...</div>
      </div>
    </div>
  );
}
