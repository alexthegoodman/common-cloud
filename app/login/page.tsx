"use client";

import AuthForm from "@/components/AuthForm";
import Features from "@/components/Features";
import Link from "next/link";

const LoginPage = () => {
  return (
    <>
      <section className="container mx-auto px-4 pt-16 pb-16 flex flex-col md:flex-row gap-8">
        <div>
          <img
            src="/stunts_logo_nobg.png"
            className="max-w-[200px] w-full mb-8"
          />
          <h1 className="text-4xl font-bold mb-8">Login</h1>
          <AuthForm />
          <p className="mt-4 text-center">
            <span className="text-gray-600">Need to sign up? </span>
            <Link
              href="/register"
              className="text-red-500 hover:text-red-600 font-medium"
            >
              Create an account
            </Link>
          </p>
        </div>
        <div>
          <Features grid={2} py={0} />
        </div>
      </section>
    </>
  );
};

export default LoginPage;
