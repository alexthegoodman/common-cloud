"use client";

import AuthForm from "@/components/AuthForm";

const LoginPage = () => {
  return (
    <>
      <header className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-4xl font-bold mb-6">Login</h1>
        <AuthForm />
      </header>
    </>
  );
};

export default LoginPage;
