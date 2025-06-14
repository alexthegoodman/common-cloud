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
import Header from "@/components/Header";

const HomePage = () => {
  const [formVisible, setFormVisible] = useState(false);

  const handleGetStarted = () => {
    setFormVisible(true);
  };

  return (
    <>
      <Header language="hi" />

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
            मोशन ग्राफिक्स अब आसान
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            स्मार्ट मोशन पाथ और इंट्यूटिव कीफ्रेम जेनरेशन के साथ मिनटों में
            शानदार एनिमेटेड वीडियो बनाएं।
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full flex items-center"
              onClick={handleGetStarted}
            >
              शुरू करें <ShieldChevron className="ml-2" />
            </button>
            <a
              href="https://www.youtube.com/watch?v=4RLdp7SI840"
              target="_blank"
              className="border border-red-500 text-red-500 hover:bg-red-500/10 px-8 py-3 rounded-full flex items-center"
            >
              डेमो देखें <Play className="ml-2 w-4 h-4" />
            </a>
          </div>
          <div className="flex justify-center gap-4 mt-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              hidden={!formVisible}
            >
              <p>Stunts का उपयोग करने के लिए रजिस्टर करें!</p>
              <AuthForm type="register" />
            </motion.div>
          </div>
        </div>
      </header>

      <Features language="hi" />

      <ComingSoonSection language="hi" />

      <Competition language="hi" />

      {/** Pricing Table */}
      <section className="container mx-auto px-4 py-16">
        <PricingTable language="hi" />
      </section>

      {/** Frequently Asked Questions */}
      <section className="container mx-auto px-4 py-16">
        <FAQ language="hi" />
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            अपने वीडियो को ट्रांसफॉर्म करने के लिए तैयार हैं?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            उन क्रिएटर्स से जुड़ें जो पहले से ही Stunts के साथ शानदार मोशन
            ग्राफिक्स बना रहे हैं।
          </p>
          <Link
            href="/register"
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full inline-flex items-center"
          >
            बनाना शुरू करें <ShieldChevron className="ml-2" />
          </Link>
        </div>
      </section>
    </>
  );
};

export default HomePage;
