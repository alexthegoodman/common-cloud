"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  ShieldChevron,
  MagicWand,
  Lightning,
  Clock,
  Video,
  Shapes,
  TextAUnderline,
  Layout,
  ArrowRight,
} from "@phosphor-icons/react";
import PricingTable from "@/components/PricingTable";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import FAQ from "@/components/FAQ";
import ComingSoonSection from "@/components/ComingSoon";
import Competition from "@/components/Competition";
import Features from "@/components/Features";
import Header from "@/components/Header";
import CreatorCarousel from "@/components/CreatorCarousel";
import SocialProof from "@/components/SocialProof";

const HomePage = () => {
  const [formVisible, setFormVisible] = useState(false);

  const handleGetStarted = () => {
    setFormVisible(true);
  };

  return (
    <>
      <Header />

      {/* Hero Section */}
      <header className="container mx-auto px-4 pt-24 pb-16">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src="/stunts_logo_blackground.png"
              alt="Stunts Logo"
              className="mx-auto mb-8 h-40"
            />
          </motion.div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-red-500 to-orange-500 text-transparent bg-clip-text">
            Go Viral with Pro Animations
          </h1>
          <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
            TikTok & Reels creators: Stop using basic templates. Get
            Netflix-quality animations that make your content impossible to
            ignore.
          </p>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Perfect for viral content, brand partnerships, personal stories, and
            private memories. Professional results in minutes.
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full flex items-center"
              onClick={handleGetStarted}
            >
              Start Creating Viral Content <ArrowRight className="ml-2" />
            </button>
            <a
              href="https://www.youtube.com/shorts/LuXI2KxavjU"
              target="_blank"
              className="border border-red-500 text-red-500 hover:bg-red-500/10 px-8 py-3 rounded-full flex items-center"
            >
              Watch Demo <Play className="ml-2 w-4 h-4" />
            </a>
          </div>
          <div className="flex justify-center gap-4 mt-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              hidden={!formVisible}
            >
              {/* <p className="block text-sm font-medium mb-1 text-slate-400">
                Register to use Stunts!
              </p> */}
              <AuthForm />
            </motion.div>
          </div>
        </div>
      </header>

      <CreatorCarousel />

      <Features />

      <SocialProof />

      <ComingSoonSection />

      <Competition />

      {/** Pricing Table */}
      <section className="container mx-auto px-4 py-16">
        <PricingTable />
      </section>

      {/** Frequently Asked Questions */}
      <section className="container mx-auto px-4 py-16">
        <FAQ />
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Ready to Get Your First Viral Video?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join 600+ creators already using Stunts to create scroll-stopping
            content.
          </p>
          <Link
            href="/register"
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full inline-flex items-center"
          >
            Get Your First Viral Video <ShieldChevron className="ml-2" />
          </Link>
        </div>
      </section>
    </>
  );
};

export default HomePage;
