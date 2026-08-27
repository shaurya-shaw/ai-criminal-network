"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserPlus,
  UserCheck,
  Fingerprint,
  Loader2,
} from "lucide-react";

export default function AuthCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const router = useRouter();
  const clerk = useClerk();

  // Prefetch routes to eliminate Next.js compilation delay on navigation
  useEffect(() => {
    router.prefetch("/sso-callback");
    router.prefetch("/dashboard");
    router.prefetch("/sign-in");
    router.prefetch("/sign-up");
  }, [router]);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState("");
  const [showSignInEmail, setShowSignInEmail] = useState(false);

  // Sign Up State
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [showSignUpEmail, setShowSignUpEmail] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{
    type: "info" | "success" | "warning";
    title: string;
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if Clerk environment key is present (client-safe check)
  const hasClerkKey = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder")
  );

  const handleGoogleAuth = async (mode: "sign-in" | "sign-up") => {
    setIsLoading(true);
    setStatusMessage(null);

    if (!hasClerkKey || !clerk) {
      setTimeout(() => {
        setIsLoading(false);
        setStatusMessage({
          type: "info",
          title: mode === "sign-in" ? "Clerk Sign In" : "Clerk Registration",
          text: `OAuth flow ready. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to activate live ${mode} with Google.`,
        });
      }, 500);
      return;
    }

    try {
      const client = clerk.client;
      // In Clerk, signIn.authenticateWithRedirect handles BOTH sign-in and new sign-up
      // automatically on callback, avoiding the pre-redirect Turnstile CAPTCHA delay.
      if (client?.signIn?.authenticateWithRedirect) {
        await client.signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: `${window.location.origin}/sso-callback`,
          redirectUrlComplete: "/dashboard",
        });
      } else if (client?.signUp?.authenticateWithRedirect) {
        await client.signUp.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: `${window.location.origin}/sso-callback`,
          redirectUrlComplete: "/dashboard",
        });
      } else {
        // Fallback to in-app route
        router.push(mode === "sign-in" ? "/sign-in" : "/sign-up");
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const errorObj = err as { errors?: { longMessage?: string }[]; message?: string };
      const msg =
        errorObj?.errors?.[0]?.longMessage ||
        errorObj?.message ||
        "Redirecting to secure clearance portal...";
      setStatusMessage({
        type: "warning",
        title: "Authentication Notice",
        text: msg,
      });
      // Gracefully redirect to the local dedicated route on any challenge
      setTimeout(() => {
        router.push(mode === "sign-in" ? "/sign-in" : "/sign-up");
      }, 800);
    }
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSignInEmail) {
      setShowSignInEmail(true);
      return;
    }

    if (!signInEmail || !signInEmail.includes("@")) {
      setStatusMessage({
        type: "warning",
        title: "Invalid Email",
        text: "Please enter a valid investigative operator email address.",
      });
      return;
    }

    setIsLoading(true);
    router.push(`/sign-in#/sign-in`);
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSignUpEmail) {
      setShowSignUpEmail(true);
      return;
    }

    if (!signUpEmail || !signUpEmail.includes("@")) {
      setStatusMessage({
        type: "warning",
        title: "Invalid Email",
        text: "Please enter a valid operator email address to create clearance.",
      });
      return;
    }

    setIsLoading(true);
    router.push(`/sign-up#/sign-up`);
  };

  return (
    <div className="relative w-full max-w-sm select-none" style={{ perspective: 1200 }}>
      {/* 3D Flipping Card Container */}
      <motion.div
        className="relative w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* ========================================================================= */}
        {/* FRONT SIDE: SIGN IN                                                       */}
        {/* ========================================================================= */}
        <div
          className={`relative w-full bg-[#0d0f17]/55 backdrop-blur-md border border-white/[0.18] p-7 md:p-8 rounded-none shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 hover:border-white/30 ${
            isFlipped ? "pointer-events-none" : ""
          }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-2 h-2 corner-bracket-tl pointer-events-none" />
          <div className="absolute top-0 right-0 w-2 h-2 corner-bracket-tr pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-2 h-2 corner-bracket-bl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-2 h-2 corner-bracket-br pointer-events-none" />

          {/* Top Header Label */}
          <div className="flex items-center justify-between pb-5 border-b border-white/[0.08] mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono tracking-[0.25em] text-white/80 font-semibold uppercase">
                SIGN IN
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-white/30 uppercase">
              AUTH // V2.4
            </span>
          </div>

          {/* Welcome Text */}
          <div className="mb-6">
            <h2 className="text-2xl font-mono font-medium tracking-tight text-white/95 leading-tight">
              Welcome
            </h2>
            <h2 className="text-2xl font-mono font-medium tracking-tight text-white/95 leading-tight">
              back.
            </h2>
            <p className="text-xs text-white/40 mt-1.5 font-sans">
              Authenticate to access classified intelligence records.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={() => handleGoogleAuth("sign-in")}
              disabled={isLoading}
              className="w-full relative flex items-center justify-center gap-3 px-4 py-3 bg-[#171924] hover:bg-[#1f2230] active:bg-[#151722] text-white/90 hover:text-white border border-white/[0.12] hover:border-white/30 text-xs font-mono tracking-wider transition-all duration-200 group disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
              ) : (
                /* Official Multi-color Google SVG Icon */
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span className="font-semibold tracking-widest">[Google]</span>
              <span className="text-white/30 text-[11px] font-sans group-hover:text-white/60 ml-auto transition-colors">
                {isLoading ? "Connecting..." : "Continue"}
              </span>
            </button>

            {/* Email Sign In / Form */}
            {showSignInEmail ? (
              <form onSubmit={handleSignInSubmit} className="space-y-2.5 pt-1">
                <div className="relative">
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="analyst@agency.gov"
                    autoFocus
                    className="w-full bg-[#0d0e14] border border-white/20 focus:border-white text-white text-xs font-mono px-3.5 py-2.5 outline-none placeholder:text-white/25 transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-semibold tracking-wider transition-colors cursor-pointer"
                  >
                    <span>Proceed to Access</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSignInEmail(false)}
                    className="px-3 py-2 bg-[#171924] border border-white/10 text-white/60 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowSignInEmail(true)}
                className="w-full relative flex items-center justify-center gap-3 px-4 py-3 bg-[#171924] hover:bg-[#1f2230] active:bg-[#151722] text-white/90 hover:text-white border border-white/[0.12] hover:border-white/30 text-xs font-mono tracking-wider transition-all duration-200 group cursor-pointer"
              >
                <Mail className="w-4 h-4 text-white/70 group-hover:text-white shrink-0" />
                <span className="font-semibold tracking-widest">[Email]</span>
                <span className="text-white/30 text-[11px] font-sans group-hover:text-white/60 ml-auto transition-colors">
                  Operator Login
                </span>
              </button>
            )}
          </div>

          {/* Status / Feedback Box */}
          {statusMessage && (
            <div
              className={`mt-4 p-3 border text-xs font-mono rounded-none animate-in fade-in slide-in-from-top-1 duration-200 ${
                statusMessage.type === "success"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : statusMessage.type === "warning"
                  ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                  : "bg-blue-950/40 border-blue-500/40 text-blue-300"
              }`}
            >
              <div className="flex items-start gap-2">
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : statusMessage.type === "warning" ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">{statusMessage.title}</div>
                  <div className="text-[11px] opacity-80 mt-0.5 font-sans leading-relaxed">
                    {statusMessage.text}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card Footer Note */}
          <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-white/30">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-white/40" />
              <span>256-BIT ENCRYPTION</span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-white/40" />
              <span>CLERK SECURED</span>
            </div>
          </div>

          {/* Flip to Sign Up Switch Button */}
          <div className="mt-4 pt-3 border-t border-white/[0.08] text-center">
            <p className="text-[11px] text-white/50 font-sans">
              Need investigator clearance?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(true);
                  setStatusMessage(null);
                  setShowSignInEmail(false);
                }}
                className="text-white hover:text-emerald-400 font-mono font-semibold text-xs ml-1 inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <UserPlus className="w-3 h-3" />
                <span className="underline underline-offset-2">Create Account</span>
                <span className="text-[10px]">→</span>
              </button>
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BACK SIDE: SIGN UP / REGISTRATION                                         */}
        {/* ========================================================================= */}
        <div
          className={`absolute inset-0 w-full bg-[#0d0f17]/55 backdrop-blur-md border border-white/[0.18] p-7 md:p-8 rounded-none shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 hover:border-white/30 ${
            !isFlipped ? "pointer-events-none" : ""
          }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-2 h-2 corner-bracket-tl pointer-events-none" />
          <div className="absolute top-0 right-0 w-2 h-2 corner-bracket-tr pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-2 h-2 corner-bracket-bl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-2 h-2 corner-bracket-br pointer-events-none" />

          {/* Top Header Label */}
          <div className="flex items-center justify-between pb-5 border-b border-white/[0.08] mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono tracking-[0.25em] text-white/80 font-semibold uppercase">
                SIGN UP
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-white/30 uppercase">
              CLEARANCE // V1.0
            </span>
          </div>

          {/* Welcome Text */}
          <div className="mb-6">
            <h2 className="text-2xl font-mono font-medium tracking-tight text-white/95 leading-tight">
              New Operator
            </h2>
            <h2 className="text-2xl font-mono font-medium tracking-tight text-white/95 leading-tight">
              Clearance.
            </h2>
            <p className="text-xs text-white/40 mt-1.5 font-sans">
              Register credentials to initialize forensic node analytics.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Google Sign Up Button */}
            <button
              type="button"
              onClick={() => handleGoogleAuth("sign-up")}
              disabled={isLoading}
              className="w-full relative flex items-center justify-center gap-3 px-4 py-3 bg-[#171924] hover:bg-[#1f2230] active:bg-[#151722] text-white/90 hover:text-white border border-white/[0.12] hover:border-white/30 text-xs font-mono tracking-wider transition-all duration-200 group disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
              ) : (
                /* Official Multi-color Google SVG Icon */
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span className="font-semibold tracking-widest">[Google]</span>
              <span className="text-white/30 text-[11px] font-sans group-hover:text-white/60 ml-auto transition-colors">
                {isLoading ? "Connecting..." : "Register"}
              </span>
            </button>

            {/* Email Registration / Form */}
            {showSignUpEmail ? (
              <form onSubmit={handleSignUpSubmit} className="space-y-2.5 pt-1">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Operator / Agent Name"
                    className="w-full bg-[#0d0e14] border border-white/20 focus:border-white text-white text-xs font-mono px-3.5 py-2 outline-none placeholder:text-white/25 transition-colors"
                  />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="operator@agency.gov"
                    autoFocus
                    className="w-full bg-[#0d0e14] border border-white/20 focus:border-white text-white text-xs font-mono px-3.5 py-2 outline-none placeholder:text-white/25 transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-semibold tracking-wider transition-colors cursor-pointer"
                  >
                    <span>Request Clearance</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSignUpEmail(false)}
                    className="px-3 py-2 bg-[#171924] border border-white/10 text-white/60 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowSignUpEmail(true)}
                className="w-full relative flex items-center justify-center gap-3 px-4 py-3 bg-[#171924] hover:bg-[#1f2230] active:bg-[#151722] text-white/90 hover:text-white border border-white/[0.12] hover:border-white/30 text-xs font-mono tracking-wider transition-all duration-200 group cursor-pointer"
              >
                <Fingerprint className="w-4 h-4 text-white/70 group-hover:text-white shrink-0" />
                <span className="font-semibold tracking-widest">[Email]</span>
                <span className="text-white/30 text-[11px] font-sans group-hover:text-white/60 ml-auto transition-colors">
                  Create Account
                </span>
              </button>
            )}
          </div>

          {/* Status / Feedback Box */}
          {statusMessage && (
            <div
              className={`mt-4 p-3 border text-xs font-mono rounded-none animate-in fade-in slide-in-from-top-1 duration-200 ${
                statusMessage.type === "success"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : statusMessage.type === "warning"
                  ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                  : "bg-blue-950/40 border-blue-500/40 text-blue-300"
              }`}
            >
              <div className="flex items-start gap-2">
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : statusMessage.type === "warning" ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">{statusMessage.title}</div>
                  <div className="text-[11px] opacity-80 mt-0.5 font-sans leading-relaxed">
                    {statusMessage.text}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card Footer Note */}
          <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-white/30">
            <div className="flex items-center gap-1.5">
              <Fingerprint className="w-3 h-3 text-white/40" />
              <span>CLEARANCE PROTOCOL</span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-white/40" />
              <span>CLERK SECURED</span>
            </div>
          </div>

          {/* Flip back to Sign In Switch Button */}
          <div className="mt-4 pt-3 border-t border-white/[0.08] text-center">
            <p className="text-[11px] text-white/50 font-sans">
              Already have credentials?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setStatusMessage(null);
                  setShowSignUpEmail(false);
                }}
                className="text-white hover:text-cyan-400 font-mono font-semibold text-xs ml-1 inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <UserCheck className="w-3 h-3" />
                <span className="underline underline-offset-2">Sign In</span>
                <span className="text-[10px]">←</span>
              </button>
            </p>
          </div>
        </div>
      </motion.div>
      <div id="clerk-captcha" className="hidden" />
    </div>
  );
}
