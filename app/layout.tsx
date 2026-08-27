import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClerkWrapper from "./components/ClerkWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "INVESTIGATE // Intelligence Without The Noise",
  description:
    "Transform fragmented criminal data into connected intelligence. Forensic entity mapping and relationship analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ backgroundColor: "#090a0d", colorScheme: "dark" }}
    >
      <body
        suppressHydrationWarning
        style={{ backgroundColor: "#090a0d" }}
        className="min-h-full bg-[#090a0d] text-[#ededed] flex flex-col font-sans selection:bg-white selection:text-black"
      >
        <ClerkWrapper>{children}</ClerkWrapper>
        {/* Mount container for Clerk bot protection / Turnstile CAPTCHA */}
        <div id="clerk-captcha" />
      </body>
    </html>
  );
}
