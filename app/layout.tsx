import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FacebookPixel from "@/components/FacebookPixel";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { ThemeProvider } from "@/app/contexts/ThemeContext";
// import { LogRocketProvider } from "@/components/LogRocketProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Common Cloud",
  description: "Gain access to Common's apps, including Stunts!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased theme-bg-primary theme-text-primary transition-colors duration-300`}
      >
        <ThemeProvider>
          {/* Skip link for keyboard navigation */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white p-2 z-50 rounded-br-md"
          >
            Skip to main content
          </a>
          {/* <LogRocketProvider> */}
          <main id="main-content">{children}</main>
          {/* </LogRocketProvider> */}
          <FacebookPixel />
          <Analytics />
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
