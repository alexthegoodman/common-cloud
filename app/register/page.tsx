"use client";

import AuthForm from "@/components/AuthForm";
import Features from "@/components/Features";
import Link from "next/link";

const RegisterPage = () => {
  return (
    <>
      <section className="container mx-auto px-4 pt-16 pb-16 flex flex-row gap-8">
        <div>
          <h2 className="text-2xl mb-4">Common | Stunts</h2>
          <h1 className="text-4xl font-bold mb-8">Register</h1>
          <AuthForm type="register" />
          <p className="mt-4">
            <Link href="/login">Login instead</Link>
          </p>
        </div>
        <div>
          <Features grid={2} py={0} />
        </div>
      </section>
    </>
  );
};

export default RegisterPage;
