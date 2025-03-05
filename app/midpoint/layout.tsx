import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Midpoint Beta | User-Friendly Game Engine",
  description:
    "Midpoint is a user-friendly game engine designed for modern AI-based workflows.",
};

export default function MidpointLayout({ children = null }) {
  return (
    <>
      <div className="min-h-screen">
        {children}

        <Footer subset="midpoint" />
      </div>
    </>
  );
}
