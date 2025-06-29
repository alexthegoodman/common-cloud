"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as fbq from "../lib/fpixel";

interface GoogleLoginButtonProps {
  onError?: (error: string) => void;
}

export default function GoogleLoginButton({ onError }: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async (credential: string) => {
    try {
      setLoading(true);

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Google login failed");

      // Track new user registration with Facebook Pixel
      if (json.isNewUser) {
        fbq.event("SignUp", { email: json.user.email, method: "google" });
      }

      localStorage.setItem("auth-token", JSON.stringify(json.jwtData));
      
      if (json.isNewUser) {
        router.push("/select-language");
      } else {
        router.push("/projects");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Google login failed";
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleSignIn = () => {
    if (typeof window !== "undefined" && window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: (response: any) => {
          handleGoogleLogin(response.credential);
        },
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "continue_with",
          shape: "rectangular",
        }
      );
    }
  };

  const handleClick = () => {
    if (typeof window !== "undefined" && window.google) {
      window.google.accounts.id.prompt();
    } else {
      initializeGoogleSignIn();
    }
  };

  return (
    <div className="w-full">
      <div id="google-signin-button" className="hidden"></div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span>{loading ? "Signing in..." : "Continue with Google"}</span>
      </button>
    </div>
  );
}

// Extend window type for Google Sign-In
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement | null, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}