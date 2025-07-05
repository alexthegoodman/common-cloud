"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as fbq from "@/lib/fpixel";

interface CompleteSignupFormData {
  password: string;
  confirmPassword: string;
}

export default function CompleteSignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState("");
  const router = useRouter();
  // const searchParams = useSearchParams();
  // get searchParams from the URL
  const searchParams = new URLSearchParams(window.location.search);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CompleteSignupFormData>();

  const password = watch("password");

  useEffect(() => {
    const sessionIdParam = searchParams.get("session_id");
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
      verifySession(sessionIdParam);
    } else {
      router.push("/register");
    }
  }, [searchParams, router]);

  const verifySession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/subscription/verify-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (response.ok && data.email) {
        setEmail(data.email);
      } else {
        setError("Invalid session. Please try again.");
        setTimeout(() => router.push("/register"), 3000);
      }
    } catch (err) {
      setError("Failed to verify session. Please try again.");
      setTimeout(() => router.push("/register"), 3000);
    }
  };

  const onSubmit = async (data: CompleteSignupFormData) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: data.password,
          sessionId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to complete signup");
      }

      // Track successful signup
      fbq.event("SignUp", { email });

      // Store auth token
      localStorage.setItem("auth-token", JSON.stringify(result.jwtData));

      // Redirect to projects
      router.push("/projects");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete signup"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-center mt-4 text-slate-600">
            Verifying your payment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Payment Successful!
          </h1>
          <p className="text-slate-600 mb-4">
            Complete your account setup by creating a password
          </p>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-sm text-slate-600">{email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Create Password
            </label>
            <input
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              type="password"
              id="password"
              placeholder="Create a password"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Confirm Password
            </label>
            <input
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating your account...</span>
              </span>
            ) : (
              "Complete Setup"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
