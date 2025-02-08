import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Stunts Beta | Common Cloud",
  description: "Video and motion graphics editor centered on UX and AI",
};

export default function StuntsLayout({ children = null }) {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-black to-slate-900">
        {children}

        <Footer />
      </div>
    </>
  );
}
