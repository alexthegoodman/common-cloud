"use client";

import Footer from "@/components/Footer";
import Link from "next/link";

export default function PolicyLayout({ children = null }) {
  return (
    <>
      <section className="container mx-auto px-4 py-16 policy">
        <h1 className="text-2xl mb-8">Common | Stunts</h1>

        {children}
      </section>

      <Footer />

      <style>
        {`
        .policy p {
            margin-bottom: 15px;
        }
        .policy ul {
            margin-bottom: 15px;
        }
        `}
      </style>
    </>
  );
}
