// components/AuthForm.tsx
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AuthFormData {
  email: string;
  password: string;
}

export default function AuthForm({ type = "login" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>();

  const onSubmit = async (data: AuthFormData) => {
    try {
      setLoading(true);
      setError("");

      let res = null;
      if (type === "login") {
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
      router.push("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 sm:w-[300px] md:w-[350px] lg:w-[400px] text-left"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
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
          className="w-full p-2 border rounded text-slate-400 placeholder:text-slate-400"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
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
          className="w-full p-2 border rounded text-slate-400 placeholder:text-slate-400"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 disabled:opacity-50"
      >
        {loading ? "Loading..." : type === "login" ? "Sign in" : "Register"}
      </button>
    </form>
  );
}
