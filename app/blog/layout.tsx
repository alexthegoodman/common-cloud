"use client";

import Footer from "@/components/Footer";
import Link from "next/link";

export default function BlogLayout({ children = null }) {
  return (
    <>
      <section className="container w-full mx-auto px-4 py-16">
        {/* <h1 className="text-2xl mb-8">Common | Blog</h1> */}

        {children}
      </section>

      <Footer />
    </>
  );
}
