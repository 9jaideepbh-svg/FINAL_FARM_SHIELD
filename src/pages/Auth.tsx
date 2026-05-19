import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSignIn, useSignUp, useUser } from "@clerk/clerk-react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Mode = "signin" | "signup";
type Step = "email" | "password" | "verify" | "name";

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(
    searchParams.get("tab") === "signup" ? "signup" : "signin"
  );
  const [step, setStep] = useState<Step>("email");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();

  // Light ring cursor effect
  const ringRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!ringRef.current) return;
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      const mx = (x - 0.5) * 140;
      const my = (y - 0.5) * 90;
      ringRef.current.style.transform = `translate(-50%, -50%) translate(${mx}px, ${my}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) navigate("/");
  }, [isLoaded, isSignedIn, navigate]);

  // Sync URL tab param
  const switchMode = (next: Mode) => {
    setMode(next);
    setStep("email");
    setError("");
    setEmail("");
    setPassword("");
    setFirstName("");
    setCode("");
    setSearchParams({ tab: next });
  };

  /* ───── Google OAuth ───── */
  const handleGoogle = useCallback(async () => {
    setError("");
    try {
      if (mode === "signin") {
        await signIn?.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        });
      } else {
        await signUp?.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        });
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Google sign-in failed.");
    }
  }, [mode, signIn, signUp]);

  /* ───── Email step ───── */
  const handleEmailContinue = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        // Check if email exists — go straight to password
        const res = await signIn!.create({ identifier: email });
        if (res.status === "needs_first_factor") {
          setStep("password");
        }
      } else {
        // Sign-up: collect name next
        setStep("name");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* ───── Sign-in password ───── */
  const handleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await signIn!.attemptFirstFactor({
        strategy: "password",
        password,
      });
      if (res.status === "complete") {
        await setActiveSignIn!({ session: res.createdSessionId });
        navigate("/");
      } else {
        setError("Unexpected error. Please try again.");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  /* ───── Sign-up: create account then send OTP ───── */
  const handleSignUp = async () => {
    setError("");
    setLoading(true);
    try {
      await signUp!.create({ emailAddress: email, password, firstName });
      await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? "Sign-up failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ───── Verify OTP ───── */
  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await signUp!.attemptEmailAddressVerification({ code });
      if (res.status === "complete") {
        await setActiveSignUp!({ session: res.createdSessionId });
        navigate("/");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────────────────────────
     Step-progress indicator (3 bars, first lit)
  ───────────────────────────────────────────── */
  const stepIndex = ["email", "name", "verify", "password"].indexOf(step);
  const totalSteps = mode === "signup" ? 3 : 2;

  /* ─────────────────────────────────────────────
     Render helpers
  ───────────────────────────────────────────── */
  const renderTitle = () => {
    if (mode === "signin") return step === "password" ? "Enter your password" : "Sign in to FARM SHIELD";
    if (step === "name") return "What's your name?";
    if (step === "verify") return "Check your email";
    return "Create your account";
  };

  const renderSubtitle = () => {
    if (mode === "signin" && step === "password") return `Signing in as ${email}`;
    if (mode === "signin") return "Welcome back! Please sign in to continue.";
    if (step === "name") return "Tell us a bit about yourself.";
    if (step === "verify") return `We sent a 6-digit code to ${email}`;
    return "Start protecting your farm with AI.";
  };

  return (
    <>
      {/* ── Inject styles (scoped to this page via class prefix) ── */}
      <style>{`
        .fs-auth-body {
          width: 100%;
          min-height: 100vh;
          background: #000;
          font-family: 'Inter', sans-serif;
          color: white;
          position: relative;
          overflow: hidden;
        }
        @media(max-width:900px){ .fs-auth-body { overflow: auto; } }

        .fs-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, #06101f 0%, #01040a 42%, #000 100%);
        }

        .fs-ring {
          position: absolute;
          width: 1350px;
          height: 1350px;
          border-radius: 50%;
          top: 50%;
          left: 44%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          transition: transform 0.08s linear;
          background: radial-gradient(circle,
            rgba(0,0,0,0) 56%,
            rgba(199,231,255,0.04) 60%,
            rgba(207,235,255,0.22) 63%,
            rgba(255,255,255,0.96) 66%,
            rgba(193,226,255,0.82) 68%,
            rgba(123,187,255,0.35) 70%,
            rgba(0,0,0,0) 74%);
          filter: blur(16px) drop-shadow(0 0 90px rgba(173,220,255,0.9)) drop-shadow(0 0 160px rgba(95,170,255,0.55));
          opacity: 0.95;
        }
        @media(max-width:900px){ .fs-ring { width:900px; height:900px; left:50%; } }

        .fs-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(0,0,0,0.08), rgba(0,0,0,0), rgba(0,0,0,0.28));
          pointer-events: none;
        }

        .fs-noise {
          position: absolute;
          inset: 0;
          opacity: 0.04;
          mix-blend-mode: soft-light;
          background-image: url("https://grainy-gradients.vercel.app/noise.svg");
        }

        .fs-side-text {
          position: absolute;
          right: 18px;
          top: 50%;
          transform: translateY(-50%) rotate(90deg);
          color: #5f6679;
          font-size: 11px;
          letter-spacing: 6px;
          z-index: 5;
          white-space: nowrap;
        }
        @media(max-width:900px){ .fs-side-text { display: none; } }

        .fs-panel {
          position: absolute;
          right: 90px;
          top: 50%;
          transform: translateY(-50%);
          width: 470px;
          background: linear-gradient(180deg, rgba(10,13,22,0.72), rgba(5,7,13,0.84));
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 42px;
          backdrop-filter: blur(28px);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02), 0 0 80px rgba(106,170,255,0.08);
          padding: 48px;
          z-index: 10;
        }
        @media(max-width:900px){
          .fs-panel {
            position: relative;
            top: auto; right: auto;
            transform: none;
            width: 92%;
            margin: 40px auto;
          }
        }

        .fs-steps {
          display: flex;
          gap: 14px;
          margin-bottom: 52px;
        }
        .fs-step-bar {
          flex: 1;
          height: 3px;
          border-radius: 999px;
          background: #161b26;
          transition: background 0.4s, box-shadow 0.4s;
        }
        .fs-step-bar.active {
          background: white;
          box-shadow: 0 0 10px white;
        }

        .fs-title {
          font-size: 42px;
          line-height: 1.05;
          letter-spacing: -2px;
          margin-bottom: 14px;
          font-weight: 800;
        }
        @media(max-width:500px){ .fs-title { font-size: 32px; } }

        .fs-subtitle {
          color: #8d95a8;
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .fs-google-btn {
          width: 100%;
          height: 68px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.06);
          background: linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          font-size: 16px;
          font-weight: 500;
          position: relative;
          cursor: pointer;
          transition: 0.3s;
          margin-bottom: 28px;
          font-family: 'Inter', sans-serif;
        }
        .fs-google-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 24px rgba(255,255,255,0.08);
        }
        .fs-google-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .fs-last-used {
          position: absolute;
          top: -11px;
          right: 20px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.06);
          font-size: 11px;
          color: #d3dbeb;
        }

        .fs-divider {
          display: flex;
          align-items: center;
          gap: 18px;
          color: #8e96a8;
          font-size: 13px;
          margin-bottom: 30px;
        }
        .fs-divider::before, .fs-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #242938;
        }

        .fs-field { margin-bottom: 28px; }
        .fs-label {
          display: block;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #dfe7f6;
        }
        .fs-input {
          width: 100%;
          height: 68px;
          border-radius: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          outline: none;
          padding: 0 24px;
          color: white;
          font-size: 16px;
          transition: 0.3s;
          font-family: 'Inter', sans-serif;
        }
        .fs-input:focus {
          border: 1px solid rgba(153,201,255,0.45);
          box-shadow: 0 0 24px rgba(121,181,255,0.12);
        }
        .fs-input::placeholder { color: #71798c; }

        .fs-continue-btn {
          width: 100%;
          height: 70px;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          background: linear-gradient(90deg, #5f4eff, #7d5dff, #684dff);
          color: white;
          font-size: 18px;
          font-weight: 700;
          box-shadow: 0 10px 30px rgba(107,77,255,0.35);
          transition: 0.3s;
          font-family: 'Inter', sans-serif;
        }
        .fs-continue-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 42px rgba(107,77,255,0.5);
        }
        .fs-continue-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .fs-back-btn {
          background: none;
          border: none;
          color: #8d95a8;
          font-size: 14px;
          cursor: pointer;
          margin-bottom: 20px;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          transition: color 0.2s;
        }
        .fs-back-btn:hover { color: white; }

        .fs-toggle {
          margin-top: 30px;
          text-align: center;
          color: #8d95a8;
          font-size: 15px;
        }
        .fs-toggle span {
          color: #7d8aff;
          font-weight: 600;
          cursor: pointer;
        }
        .fs-toggle span:hover { text-decoration: underline; }

        .fs-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.05);
          text-align: center;
          line-height: 1.9;
          color: #8d95a8;
          font-size: 13px;
        }
        .fs-clerk { color: white; font-weight: 700; }
        .fs-dev { color: #ff934d; font-weight: 700; }

        .fs-error {
          background: rgba(255,70,70,0.08);
          border: 1px solid rgba(255,70,70,0.2);
          border-radius: 14px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #ff8080;
          line-height: 1.5;
        }

        .fs-logo-back {
          position: absolute;
          top: 32px;
          left: 40px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: white;
          opacity: 0.7;
          font-size: 14px;
          font-weight: 600;
          transition: opacity 0.2s;
        }
        .fs-logo-back:hover { opacity: 1; }
        @media(max-width:900px){ .fs-logo-back { left: 20px; top: 20px; } }
      `}</style>

      <div className="fs-auth-body">
        {/* Background */}
        <div className="fs-bg" />
        <div className="fs-ring" ref={ringRef} />
        <div className="fs-overlay" />
        <div className="fs-noise" />

        {/* Back to home */}
        <a href="/" className="fs-logo-back">
          ← FARM SHIELD
        </a>

        {/* Side text */}
        <div className="fs-side-text">SECURE • SHIELD • GROW</div>

        {/* Auth Panel */}
        <div className="fs-panel">

          {/* Step bars */}
          <div className="fs-steps">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`fs-step-bar ${i <= stepIndex ? "active" : ""}`}
              />
            ))}
          </div>

          {/* Back button (shown after first step) */}
          {step !== "email" && (
            <button
              className="fs-back-btn"
              onClick={() => {
                setError("");
                if (step === "password") setStep("email");
                else if (step === "name") setStep("email");
                else if (step === "verify") setStep("name");
              }}
            >
              ← Back
            </button>
          )}

          {/* Title */}
          <h1 className="fs-title">{renderTitle()}</h1>
          <div className="fs-subtitle">{renderSubtitle()}</div>

          {/* Error */}
          {error && <div className="fs-error">{error}</div>}

          {/* ── STEP: Email (initial step for both modes) ── */}
          {step === "email" && (
            <>
              {/* Google OAuth */}
              <button className="fs-google-btn" onClick={handleGoogle} disabled={loading}>
                <div className="fs-last-used">Recommended</div>
                <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                  <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" fill="#FFC107"/>
                  <path d="M6.3 14.7l6.6 4.8C14.6 16 19 12 24 12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" fill="#FF3D00"/>
                  <path d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.1 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.5 40 16.2 44 24 44z" fill="#4CAF50"/>
                  <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l.1-.1 6.2 5.2C37.2 39 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" fill="#1976D2"/>
                </svg>
                Continue with Google
              </button>

              <div className="fs-divider">or</div>

              {/* Email input */}
              <div className="fs-field">
                <label className="fs-label">Email address</label>
                <input
                  type="email"
                  className="fs-input"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleEmailContinue()}
                  autoFocus
                />
              </div>

              <button
                className="fs-continue-btn"
                onClick={handleEmailContinue}
                disabled={loading || !email.trim()}
              >
                {loading ? "Checking..." : "Continue →"}
              </button>

              <div className="fs-toggle">
                {mode === "signin" ? (
                  <>Don't have an account? <span onClick={() => switchMode("signup")}>Sign up</span></>
                ) : (
                  <>Already have an account? <span onClick={() => switchMode("signin")}>Sign in</span></>
                )}
              </div>
            </>
          )}

          {/* ── STEP: Name (sign-up only) ── */}
          {step === "name" && (
            <>
              <div className="fs-field">
                <label className="fs-label">First name</label>
                <input
                  type="text"
                  className="fs-input"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && setStep("password")}
                  autoFocus
                />
              </div>
              <button
                className="fs-continue-btn"
                onClick={() => { setError(""); setStep("password"); }}
                disabled={!firstName.trim()}
              >
                Continue →
              </button>
            </>
          )}

          {/* ── STEP: Password (both modes, sign-up sets new password) ── */}
          {step === "password" && (
            <>
              <div className="fs-field">
                <label className="fs-label">
                  {mode === "signup" ? "Create a password" : "Password"}
                </label>
                <input
                  type="password"
                  className="fs-input"
                  placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      mode === "signin" ? handleSignIn() : handleSignUp();
                    }
                  }}
                  autoFocus
                />
              </div>
              <button
                className="fs-continue-btn"
                onClick={mode === "signin" ? handleSignIn : handleSignUp}
                disabled={loading || !password.trim()}
              >
                {loading
                  ? (mode === "signin" ? "Signing in..." : "Creating account...")
                  : (mode === "signin" ? "Sign In →" : "Create Account →")}
              </button>
            </>
          )}

          {/* ── STEP: Email verification (sign-up) ── */}
          {step === "verify" && (
            <>
              <div className="fs-field">
                <label className="fs-label">Verification code</label>
                <input
                  type="text"
                  className="fs-input"
                  placeholder="6-digit code"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleVerify()}
                  maxLength={6}
                  autoFocus
                />
              </div>
              <button
                className="fs-continue-btn"
                onClick={handleVerify}
                disabled={loading || code.length < 6}
              >
                {loading ? "Verifying..." : "Verify & Continue →"}
              </button>
            </>
          )}

          {/* Footer */}
          <div className="fs-footer">
            Secured by <span className="fs-clerk">Clerk</span>
            <br />
            <span className="fs-dev">Development mode</span>
          </div>
        </div>
      </div>
    </>
  );
}