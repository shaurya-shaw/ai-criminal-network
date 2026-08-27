"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";

interface ClerkWrapperProps {
  children: React.ReactNode;
}

export default function ClerkWrapper({ children }: ClerkWrapperProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isKeyConfigured =
    publishableKey && !publishableKey.includes("placeholder");

  if (!isKeyConfigured) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
      appearance={{
        variables: {
          colorPrimary: "#ffffff",
          colorBackground: "#11131a",
          colorInput: "#0d0e14",
          colorInputForeground: "#ffffff",
          colorForeground: "#ededed",
          colorMutedForeground: "#8b90a0",
          colorNeutral: "#ffffff",
          borderRadius: "0px",
          fontFamily: "var(--font-geist-mono), monospace",
        },
        elements: {
          rootBox: "w-full",
          cardBox: "w-full shadow-none",
          card: "bg-[#11131a]/95 backdrop-blur-md border border-white/[0.12] rounded-none shadow-2xl font-mono text-white p-7 sm:p-8 hover:border-white/20 transition-colors w-full",
          headerTitle: "text-white font-mono text-xl sm:text-2xl font-medium tracking-tight",
          headerSubtitle: "text-white/40 text-xs font-sans mt-1",
          socialButtonsBlockButton:
            "bg-[#171924] border border-white/[0.12] hover:border-white/30 hover:bg-[#1f2230] text-white font-mono text-xs rounded-none py-3 transition-all duration-200 cursor-pointer shadow-none",
          socialButtonsBlockButtonText:
            "font-mono text-xs font-semibold tracking-wider text-white",
          formButtonPrimary:
            "bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase font-semibold rounded-none py-2.5 transition-colors cursor-pointer shadow-none",
          formFieldInput:
            "bg-[#0d0e14] border border-white/20 focus:border-white text-white font-mono text-xs rounded-none py-2.5 transition-colors outline-none",
          formFieldLabel:
            "text-white/70 font-mono text-[11px] uppercase tracking-wider",
          footerActionText: "text-white/40 text-xs font-sans",
          footerActionLink:
            "text-white hover:text-emerald-400 font-mono font-semibold text-xs underline underline-offset-2 transition-colors",
          dividerLine: "bg-white/[0.08]",
          dividerText: "text-white/30 font-mono text-[10px] uppercase tracking-widest",
          identityPreviewText: "text-white font-mono text-xs",
          identityPreviewEditButton:
            "text-white/60 hover:text-white font-mono text-xs underline",
          formResendCodeLink:
            "text-white hover:text-emerald-400 font-mono text-xs underline",
          otpCodeFieldInput:
            "bg-[#0d0e14] border border-white/20 text-white font-mono text-lg rounded-none focus:border-white",
          alert:
            "bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono text-xs rounded-none",
          alertText: "text-amber-200 font-mono text-xs",
          formFieldSuccessText: "text-emerald-400 font-mono text-xs",
          formFieldErrorText: "text-rose-400 font-mono text-xs",
          footer: "border-t border-white/[0.06] pt-3.5 mt-4",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
