// // components/AuthForm.tsx
// import { useForm } from "react-hook-form";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import * as fbq from "../lib/fpixel";

// interface AuthFormData {
//   email: string;
//   password: string;
// }

// export default function AuthForm({ type = "login" }) {
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<AuthFormData>();

//   const onSubmit = async (data: AuthFormData) => {
//     try {
//       setLoading(true);
//       setError("");

//       let res = null;
//       if (type === "login") {
//         res = await fetch("/api/auth/login", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(data),
//         });
//       } else {
//         res = await fetch("/api/auth/register", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ name: "Default Name", ...data }),
//         });

//         fbq.event("SignUp", { email: data.email });
//       }

//       const json = await res.json();

//       if (!res.ok) throw new Error(json.error || "Authentication failed");

//       console.info(
//         "json.jwtData",
//         json.jwtData,
//         json,
//         JSON.stringify(json.jwtData)
//       );

//       localStorage.setItem("auth-token", JSON.stringify(json.jwtData));
//       router.push("/projects");
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Authentication failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <form
//       onSubmit={handleSubmit(onSubmit)}
//       className="space-y-4 sm:w-[300px] md:w-[350px] lg:w-[400px] text-left"
//     >
//       <div>
//         <label
//           htmlFor="email"
//           className="block text-sm font-medium mb-1 text-slate-400"
//         >
//           Email
//         </label>
//         <input
//           {...register("email", {
//             required: "Email is required",
//             pattern: {
//               value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
//               message: "Invalid email address",
//             },
//           })}
//           type="email"
//           className="w-full p-2 border rounded text-slate-400 placeholder:text-slate-400"
//         />
//         {errors.email && (
//           <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
//         )}
//       </div>

//       <div>
//         <label
//           htmlFor="password"
//           className="block text-sm font-medium mb-1 text-slate-400"
//         >
//           Password
//         </label>
//         <input
//           {...register("password", {
//             required: "Password is required",
//             minLength: {
//               value: 6,
//               message: "Password must be at least 6 characters",
//             },
//           })}
//           type="password"
//           className="w-full p-2 border rounded text-slate-400 placeholder:text-slate-400"
//         />
//         {errors.password && (
//           <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
//         )}
//       </div>

//       {error && <div className="text-red-500 text-sm">{error}</div>}

//       <button
//         type="submit"
//         disabled={loading}
//         className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 disabled:opacity-50"
//       >
//         {loading ? "Loading..." : type === "login" ? "Sign in" : "Register"}
//       </button>
//     </form>
//   );
// }

// components/AuthForm.tsx
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as fbq from "../lib/fpixel";
import { ArrowLeft } from "@phosphor-icons/react";

interface AuthFormData {
  email: string;
  password: string;
}

type AuthStep = "email" | "password";
type AuthMode = "login" | "signup";

export default function AuthForm() {
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
      setMode(json.userExists ? "login" : "signup");
      setStep("password");
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
    } else {
      await handleAuth(data);
    }
  };

  return (
    <div className="space-y-6 sm:w-[300px] md:w-[350px] lg:w-[400px] text-left">
      {/* Progress indicator */}
      <div className="flex items-center space-x-2 mb-6">
        <div
          className={`w-3 h-3 rounded-full transition-colors ${
            step === "email" ? "bg-red-500" : "bg-green-500"
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === "email" ? (
          /* Email Step */
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-700 mb-2">
                Welcome
              </h2>
              <p className="text-slate-500">Enter your email to get started</p>
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
                placeholder="Enter your email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-slate-700 placeholder:text-slate-400"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
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
              ) : (
                "Continue"
              )}
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
                placeholder={
                  mode === "login" ? "Enter your password" : "Create a password"
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-slate-700 placeholder:text-slate-400"
                autoFocus
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
              {mode === "signup" && (
                <p className="text-xs text-slate-500 mt-1">
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

            <button
              type="button"
              onClick={handleBackToEmail}
              className="w-full text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
              <ArrowLeft /> Back to email
            </button>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
