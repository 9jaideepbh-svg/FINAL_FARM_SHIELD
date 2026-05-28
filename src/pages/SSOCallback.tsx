// This file is no longer used. Google OAuth now uses signInWithPopup (no redirect callback needed).
// Keeping as stub to prevent import errors in case of cached references.
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SSOCallback() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/", { replace: true }); }, [navigate]);
  return null;
}
