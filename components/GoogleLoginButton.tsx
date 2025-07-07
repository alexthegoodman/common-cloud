"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import * as fbq from "../lib/fpixel";

interface GoogleLoginButtonProps {
  onError?: (error: string) => void;
}

export default function GoogleLoginButton({ onError }: GoogleLoginButtonProps) {
  const router = useRouter();

  const handleGoogleLogin = async (credential: string) => {
    try {
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

      // if (json.isNewUser) {
      //   // For new users, redirect to checkout for subscription
      //   router.push("/upgrade");
      // } else {
      //   router.push("/projects");
      // }
      router.push("/projects");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Google login failed";
      onError?.(errorMessage);
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (typeof window !== "undefined" && window.google && clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            handleGoogleLogin(response.credential);
          },
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          {
            theme: "filled_blue",
            size: "large",
            width: "100%",
            text: "continue_with",
            shape: "rectangular",
          }
        );
      }
    };

    // Wait for Google script to load and initialize
    const checkGoogleLoaded = () => {
      if (window.google) {
        initializeGoogleSignIn();
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    checkGoogleLoaded();
  }, []);

  return (
    <div className="w-full">
      <div id="google-signin-button"></div>
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
