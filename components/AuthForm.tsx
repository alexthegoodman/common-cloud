import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as fbq from "../lib/fpixel";
import { ArrowLeft } from "@phosphor-icons/react";
import GoogleLoginButton from "./GoogleLoginButton";

interface AuthFormData {
  email: string;
  password: string;
}

type AuthStep = "email" | "payment" | "password";
type AuthMode = "login" | "signup";

export default function AuthForm({ loginOnly = false }: { loginOnly?: boolean }) {
  const [step, setStep] = useState<AuthStep>("email");
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<AuthFormData>();

  const watchedEmail = watch("email");

  const checkEmail = async (email: string) => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Failed to check email");

      setEmailValue(email);
      if (loginOnly && !json.userExists) {
        throw new Error("No account found with this email. Please sign up first.");
      }
      setMode(json.userExists ? "login" : "signup");
      setStep(json.userExists ? "password" : loginOnly ? "password" : "payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check email");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    const isValid = await trigger("email");
    if (isValid && watchedEmail) {
      await checkEmail(watchedEmail);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError("");

      // For signup flow, redirect to Stripe checkout
      if (mode === "signup") {
        // Get available plans to find the price ID
        const plansResponse = await fetch("/api/plans/all");
        const plansData = await plansResponse.json();

        if (!plansData.plans || plansData.plans.length === 0) {
          throw new Error("No subscription plans available");
        }

        const plan = plansData.plans[0]; // Use the first (and only) plan
        const priceId =
          process.env.NODE_ENV === "production"
            ? plan.stripePriceId
            : plan.stripeDevPriceId;

        if (!priceId) {
          throw new Error("Subscription plan not configured");
        }

        const response = await fetch("/api/subscription/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailValue,
            priceId: priceId,
          }),
        });

        const data = await response.json();

        if (data.url) {
          // Store email for after payment completion
          sessionStorage.setItem("signup-email", emailValue);
          window.location.href = data.url;
        } else {
          throw new Error(data.error || "Failed to create checkout session");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (data: AuthFormData) => {
    try {
      setLoading(true);
      setError("");

      let res = null;
      if (mode === "login") {
        res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Default Name", ...data }),
        });

        fbq.event("SignUp", { email: data.email });
      }

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Authentication failed");

      console.info(
        "json.jwtData",
        json.jwtData,
        json,
        JSON.stringify(json.jwtData)
      );

      localStorage.setItem("auth-token", JSON.stringify(json.jwtData));
      if (mode === "login") {
        router.push("/projects");
      } else {
        router.push("/select-language");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setMode(null);
    setError("");
    setValue("password", "");
  };

  const onSubmit = async (data: AuthFormData) => {
    if (step === "email") {
      await handleEmailSubmit();
    } else if (step === "payment") {
      await handlePayment();
    } else {
      await handleAuth(data);
    }
  };

  return (
    <div className="space-y-6 sm:w-[300px] md:w-[350px] lg:w-[400px] text-left">
      {/* Progress indicator - only show for signup flow */}
      {!loginOnly && (
      <div className="flex items-center space-x-2 mb-6">
        <div
          className={`w-3 h-3 rounded-full transition-colors ${
            step === "email" ? "bg-red-500" : "bg-green-500"
          }`}
        />
        <div
          className={`flex-1 h-0.5 transition-colors ${
            step === "payment" || step === "password"
              ? "bg-red-500"
              : "bg-gray-300"
          }`}
        />
        <div
          className={`w-3 h-3 rounded-full transition-colors ${
            step === "payment"
              ? "bg-red-500"
              : step === "password"
              ? "bg-green-500"
              : "bg-gray-300"
          }`}
        />
        <div
          className={`flex-1 h-0.5 transition-colors ${
            step === "password" ? "bg-red-500" : "bg-gray-300"
          }`}
        />
        <div
          className={`w-3 h-3 rounded-full transition-colors ${
            step === "password" ? "bg-red-500" : "bg-gray-300"
          }`}
        />
      </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === "email" ? (
          /* Email Step */
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-700 mb-2">
                {loginOnly ? "Welcome Back" : "Welcome"}
              </h2>
              <p className="text-slate-500">
                {loginOnly ? "Enter your email to sign in" : "Enter your email to get started"}
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2 text-slate-600"
              >
                Email Address
              </label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                type="email"
                id="email"
                placeholder="Enter your email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-slate-700 placeholder:text-slate-400"
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="text-red-500 text-sm mt-1"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !watchedEmail}
              className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Checking...</span>
                </span>
              ) : loginOnly ? (
                "Continue"
              ) : (
                "Proceed To Checkout"
              )}
            </button>
            {/* 
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div> */}

            {/* <GoogleLoginButton onError={setError} /> */}
          </>
        ) : step === "payment" ? (
          /* Payment Step */
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-700 mb-2">
                Subscribe to Continue
              </h2>
              <p className="text-slate-500">
                Complete your subscription to create your account
              </p>
              <div className="mt-3 p-2 bg-gray-100 rounded-lg">
                <p className="text-sm text-slate-600 flex items-center justify-between">
                  <span>{emailValue}</span>
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="text-red-500 hover:text-red-600 text-xs font-medium"
                  >
                    Change
                  </button>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-lg border mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-700">
                  Stunts Standard
                </span>
                <span className="text-2xl font-bold text-slate-900">$0.99</span>
              </div>
              <p className="text-slate-600 text-sm mb-4">per month</p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-slate-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Unlimited Projects
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Advanced Video Editing
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Premium Export Options
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Redirecting to checkout...</span>
                </span>
              ) : (
                "Continue to Payment"
              )}
            </button>

            <button
              type="button"
              onClick={handleBackToEmail}
              className="w-full text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <ArrowLeft size={16} /> Back to email
            </button>
          </>
        ) : (
          /* Password Step */
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-700 mb-2">
                {mode === "login" ? "Welcome back!" : "Create account"}
              </h2>
              <p className="text-slate-500">
                {mode === "login"
                  ? "Enter your password to sign in"
                  : "Create a password for your new account"}
              </p>
              <div className="mt-3 p-2 bg-gray-100 rounded-lg">
                <p className="text-sm text-slate-600 flex items-center justify-between">
                  <span>{emailValue}</span>
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="text-red-500 hover:text-red-600 text-xs font-medium"
                  >
                    Change
                  </button>
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2 text-slate-600"
              >
                Password
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
                placeholder={
                  mode === "login" ? "Enter your password" : "Create a password"
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-slate-700 placeholder:text-slate-400"
                aria-describedby={
                  errors.password
                    ? "password-error"
                    : mode === "signup"
                    ? "password-help"
                    : undefined
                }
                aria-invalid={errors.password ? "true" : "false"}
                autoFocus
              />
              {errors.password && (
                <p
                  id="password-error"
                  className="text-red-500 text-sm mt-1"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
              {mode === "signup" && (
                <p id="password-help" className="text-xs text-slate-500 mt-1">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </span>
                </span>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>

            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <GoogleLoginButton onError={setError} /> */}

            <button
              type="button"
              onClick={handleBackToEmail}
              className="w-full text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Back to email
            </button>
          </>
        )}

        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
