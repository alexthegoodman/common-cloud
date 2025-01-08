"use client";

import Footer from "@/components/Footer";
import Link from "next/link";

export default function StuntsLayout({ children = null }) {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-black to-slate-900">
        {children}

        {/* Footer */}

        <Footer />
      </div>
    </>
  );
}
