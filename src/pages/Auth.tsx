import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, sendEmailVerification, GoogleAuthProvider, signInWithPopup,
} from "firebase/auth";
import app from "../firebase";
import { useFirebaseAuth } from "@/contexts/AuthContext";

type Mode = "signin" | "signup";
type Step = "email" | "password" | "name" | "verify";

const firebaseAuth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get("tab") === "signup" ? "signup" : "signin");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useFirebaseAuth();

  useEffect(() => {
    if (!authLoading && user) {
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [authLoading, user, navigate, location]);

  const switchMode = (next: Mode) => {
    setMode(next); setStep("email"); setError("");
    setEmail(""); setPassword(""); setFirstName("");
    setSearchParams({ tab: next });
  };

  const handleGoogle = useCallback(async () => {
    setError(""); setLoading(true);
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
      navigate((location.state as any)?.from?.pathname || "/", { replace: true });
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") setError(err?.message ?? "Google sign-in failed.");
    } finally { setLoading(false); }
  }, [navigate, location.state]);

  const handleEmailContinue = () => {
    setError("");
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email address."); return; }
    setStep(mode === "signin" ? "password" : "name");
  };

  const handleSignIn = async () => {
    setError(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      navigate((location.state as any)?.from?.pathname || "/", { replace: true });
    } catch (err: any) {
      const c = err?.code || "";
      if (c === "auth/wrong-password" || c === "auth/invalid-credential") setError("Incorrect password.");
      else if (c === "auth/user-not-found") setError("No account found. Please sign up first.");
      else if (c === "auth/too-many-requests") setError("Too many attempts. Please wait.");
      else setError(err?.message ?? "Invalid credentials.");
    } finally { setLoading(false); }
  };

  const handleSignUp = async () => {
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(cred.user, { displayName: firstName });
      await sendEmailVerification(cred.user);
      setStep("verify");
    } catch (err: any) {
      const c = err?.code || "";
      if (c === "auth/email-already-in-use") setError("Account already exists. Please sign in.");
      else setError(err?.message ?? "Sign-up failed.");
    } finally { setLoading(false); }
  };

  const handleVerified = async () => {
    setError(""); setLoading(true);
    try {
      await firebaseAuth.currentUser?.reload();
      if (firebaseAuth.currentUser?.emailVerified) {
        navigate((location.state as any)?.from?.pathname || "/", { replace: true });
      } else {
        setError("Email not verified yet. Please click the link in your inbox.");
      }
    } finally { setLoading(false); }
  };

  const stepOrder: Step[] = mode === "signup" ? ["email", "name", "password", "verify"] : ["email", "password"];
  const stepIndex = stepOrder.indexOf(step);
  const totalSteps = stepOrder.length;

  const renderTitle = () => {
    if (mode === "signin") return step === "password" ? "Enter password" : "Sign in to FARM SHIELD";
    if (step === "name") return "What's your name?";
    if (step === "verify") return "Verify your email";
    if (step === "password") return "Create a password";
    return "Create account";
  };

  const renderSubtitle = () => {
    if (mode === "signin" && step === "password") return `Signing in as ${email}`;
    if (mode === "signin") return "Welcome back! Please sign in to continue.";
    if (step === "name") return "Tell us a bit about yourself.";
    if (step === "verify") return `We sent a verification link to ${email}`;
    if (step === "password") return `Setting up account for ${email}`;
    return "Start protecting your farm with AI.";
  };

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden flex flex-col justify-between items-center font-sans selection:bg-white/20 selection:text-white">
      <video autoPlay loop muted playsInline className="fixed inset-0 w-full h-full object-cover z-[0]">
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_114316_1c7889ad-2885-410e-b493-98119fee0ddb.mp4" type="video/mp4" />
      </video>
      <div className="fixed inset-0 bg-transparent z-[1] pointer-events-none" />

      <div className="w-full max-w-[1600px] px-8 md:px-16 pt-8 pb-4 flex justify-between items-center z-[10] relative">
        <a href="/" className="flex items-center gap-2 text-white font-sans text-xl font-medium tracking-tight hover:opacity-80 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
            <path d="M 4.688 136 C 68.373 136 120 187.627 120 251.312 C 120 252.883 119.967 254.445 119.905 256 L 0 256 L 0 136.096 C 1.555 136.034 3.117 136 4.688 136 Z M 251.312 136 C 252.883 136 254.445 136.034 256 136.096 L 256 256 L 136.095 256 C 136.032 254.438 136.001 252.875 136 251.312 C 136 187.627 187.627 136 251.312 136 Z M 119.905 0 C 119.967 1.555 120 3.117 120 4.688 C 120 68.373 68.373 120 4.687 120 C 3.117 120 1.555 119.967 0 119.905 L 0 0 Z M 256 119.905 C 254.445 119.967 252.883 120 251.312 120 C 187.627 120 136 68.373 136 4.687 C 136 3.117 136.033 1.555 136.095 0 L 256 0 Z" />
          </svg>
          <span className="tracking-widest text-lg font-bold">FARM SHIELD</span>
        </a>
      </div>

      <div className="w-full max-w-[1600px] px-8 md:px-16 flex-grow flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16 pt-12 md:pt-20 pb-20 z-[10] relative">
        <div className="flex-1 text-left hidden md:flex flex-col gap-6 text-white max-w-lg">
          <h2 className="text-5xl lg:text-6xl font-bold font-sans tracking-tight leading-[1.1] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Protecting Your Farm <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-yellow-200">
              With High-Fidelity AI.
            </span>
          </h2>
          <p className="text-white/85 text-base lg:text-lg leading-relaxed font-light font-sans drop-shadow-[0_1px_5px_rgba(0,0,0,0.5)]">
            Access specialized diagnostic pipelines, interactive crop growth simulators, regional schemes, and deep-learning price forecasts.
          </p>
          <div className="flex items-center gap-4 mt-4 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              Active Node
            </span>
            <span>•</span><span>SSL Secure</span><span>•</span><span>Firebase Verified</span>
          </div>
        </div>

        <div className="w-full md:w-[480px] flex justify-center shrink-0">
          <div className="liquid-glass w-full min-h-[580px] rounded-[36px] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_50px_rgba(52,211,153,0.15)] flex flex-col justify-between">
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col flex-grow justify-between relative z-10">
              <div>
                {/* Step bars */}
                <div className="flex gap-3 mb-8">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-500 ${i <= stepIndex ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-white/10"}`} />
                  ))}
                </div>

                {step !== "email" && step !== "verify" && (
                  <button className="flex items-center gap-1 text-white/50 hover:text-white text-xs mb-6 transition-colors font-sans"
                    onClick={() => {
                      setError("");
                      if (step === "password" && mode === "signin") setStep("email");
                      else if (step === "name") setStep("email");
                      else if (step === "password" && mode === "signup") setStep("name");
                    }}>← Back</button>
                )}

                <h1 className="text-3xl font-bold font-sans tracking-tight mb-2 text-white">{renderTitle()}</h1>
                <p className="text-white/60 text-sm leading-relaxed mb-8 font-sans">{renderSubtitle()}</p>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 text-red-300 text-xs leading-relaxed font-sans">{error}</div>
                )}

                {step === "email" && (
                  <div className="space-y-6">
                    <button className="w-full h-[60px] rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white flex items-center justify-center gap-3 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 relative group font-sans"
                      onClick={handleGoogle} disabled={loading}>
                      <div className="absolute top-[-9px] right-5 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-semibold text-emerald-300 tracking-wider uppercase opacity-80 group-hover:opacity-100 transition-opacity">Recommended</div>
                      <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                        <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" fill="#FFC107"/>
                        <path d="M6.3 14.7l6.6 4.8C14.6 16 19 12 24 12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" fill="#FF3D00"/>
                        <path d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.1 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.5 40 16.2 44 24 44z" fill="#4CAF50"/>
                        <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l.1-.1 6.2 5.2C37.2 39 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" fill="#1976D2"/>
                      </svg>
                      <span>Continue with Google</span>
                    </button>

                    <div className="flex items-center gap-4 text-xs text-white/30">
                      <div className="flex-1 h-[1px] bg-white/10" /><span>or</span><div className="flex-1 h-[1px] bg-white/10" />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-white/70 font-sans">Email Address</label>
                      <input type="email"
                        className="w-full h-[60px] rounded-full bg-white/[0.03] border border-white/10 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none px-6 text-sm text-white placeholder-white/20 transition-all duration-300 font-sans"
                        placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleEmailContinue()} autoFocus />
                    </div>

                    <button className="w-full h-[60px] rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none font-sans"
                      onClick={handleEmailContinue} disabled={loading || !email.trim()}>Continue →</button>

                    <div className="text-center text-xs text-white/50 font-sans">
                      {mode === "signin"
                        ? <>Don't have an account? <span onClick={() => switchMode("signup")} className="text-emerald-400 font-semibold cursor-pointer hover:underline">Sign up</span></>
                        : <>Already have an account? <span onClick={() => switchMode("signin")} className="text-emerald-400 font-semibold cursor-pointer hover:underline">Sign in</span></>}
                    </div>
                  </div>
                )}

                {step === "name" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-white/70 font-sans">First Name</label>
                      <input type="text"
                        className="w-full h-[60px] rounded-full bg-white/[0.03] border border-white/10 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none px-6 text-sm text-white placeholder-white/20 transition-all duration-300 font-sans"
                        placeholder="Enter your first name" value={firstName} onChange={e => setFirstName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && firstName.trim() && setStep("password")} autoFocus />
                    </div>
                    <button className="w-full h-[60px] rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none font-sans"
                      onClick={() => { setError(""); setStep("password"); }} disabled={!firstName.trim()}>Continue →</button>
                  </div>
                )}

                {step === "password" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-white/70 font-sans">{mode === "signup" ? "Create a Password" : "Password"}</label>
                      <input type="password"
                        className="w-full h-[60px] rounded-full bg-white/[0.03] border border-white/10 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none px-6 text-sm text-white placeholder-white/20 transition-all duration-300 font-sans"
                        placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"}
                        value={password} onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (mode === "signin" ? handleSignIn() : handleSignUp())} autoFocus />
                    </div>
                    <button className="w-full h-[60px] rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none font-sans"
                      onClick={mode === "signin" ? handleSignIn : handleSignUp} disabled={loading || !password.trim()}>
                      {loading ? (mode === "signin" ? "Signing in..." : "Creating account...") : (mode === "signin" ? "Sign In →" : "Create Account →")}
                    </button>
                  </div>
                )}

                {step === "verify" && (
                  <div className="space-y-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center">
                      <div className="text-4xl mb-3">📧</div>
                      <p className="text-white/80 text-sm font-sans leading-relaxed">
                        A verification link was sent to <span className="text-emerald-400 font-semibold">{email}</span>.<br />
                        Click the link in your email, then press the button below.
                      </p>
                    </div>
                    <button className="w-full h-[60px] rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none font-sans"
                      onClick={handleVerified} disabled={loading}>
                      {loading ? "Checking..." : "I've Verified My Email →"}
                    </button>
                    <button className="w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors font-sans"
                      onClick={() => sendEmailVerification(firebaseAuth.currentUser!)}>Resend verification email</button>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-white/40 tracking-wider uppercase font-sans">
                <span>Powered by Firebase</span>
                <span className="text-emerald-400 font-semibold">Production Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}