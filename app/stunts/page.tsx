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
} from "@phosphor-icons/react";
import PricingTable from "@/components/PricingTable";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import FAQ from "@/components/FAQ";
import ComingSoonSection from "@/components/ComingSoon";
import Competition from "@/components/Competition";
import Features from "@/components/Features";

const HomePage = () => {
  const [formVisible, setFormVisible] = useState(false);

  const handleGetStarted = () => {
    setFormVisible(true);
  };

  return (
    <>
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
            Motion Graphics Made Simple
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Create stunning animated videos in minutes with smart motion paths
            and intuitive keyframe generation.
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full flex items-center"
              onClick={handleGetStarted}
            >
              Get Started <ShieldChevron className="ml-2" />
            </button>
            <a
              href="https://youtu.be/RBBu3HGKD5s?si=T3X7vdAYh51IuCnh"
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
              <p>Register to download Stunts!</p>
              <AuthForm type="register" />
            </motion.div>
          </div>
        </div>
      </header>

      <Features />

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
            Ready to Transform Your Videos?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join creators who are already making stunning motion graphics with
            Stunts.
          </p>
          <Link
            href="/register"
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full inline-flex items-center"
          >
            Start Creating <ShieldChevron className="ml-2" />
          </Link>
        </div>
      </section>
    </>
  );
};

export default HomePage;
