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
            प्रो एनिमेशन के साथ वायरल हो जाएं
          </h1>
          <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
            TikTok और Reels क्रिएटर्स: बेसिक टेम्प्लेट्स का इस्तेमाल बंद करें।
            Netflix-क्वालिटी एनिमेशन पाएं जो आपके कंटेंट को इग्नोर करना असंभव
            बनाती है।
          </p>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            वायरल कंटेंट, ब्रांड पार्टनरशिप, पर्सनल स्टोरीज और प्राइवेट मेमोरीज
            के लिए परफेक्ट। मिनटों में प्रोफेशनल रिजल्ट्स।
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full flex items-center"
              onClick={handleGetStarted}
            >
              वायरल कंटेंट बनाना शुरू करें <ArrowRight className="ml-2" />
            </button>
            <a
              href="https://www.youtube.com/shorts/LuXI2KxavjU"
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
              <AuthForm />
            </motion.div>
          </div>
        </div>
      </header>

      <CreatorCarousel language="hi" />

      <Features language="hi" />

      <SocialProof language="hi" />

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
            अपना पहला वायरल वीडियो बनाने के लिए तैयार हैं?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            600+ क्रिएटर्स से जुड़ें जो पहले से ही Stunts के साथ
            स्क्रॉल-स्टॉपिंग कंटेंट बना रहे हैं।
          </p>
          <Link
            href="/register"
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full inline-flex items-center"
          >
            अपना पहला वायरल वीडियो बनाएं <ShieldChevron className="ml-2" />
          </Link>
        </div>
      </section>
    </>
  );
};

export default HomePage;
