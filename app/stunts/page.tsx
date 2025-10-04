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
import MosaicCreatorSection from "@/components/MosaicCreatorSection";
import SocialProof from "@/components/SocialProof";
import { ClientOnly } from "@/components/ClientOnly";
// import TextAnimationDemo from "@/components/stunts-app/TextAnimationDemo";

const HomePage = () => {
  const [formVisible, setFormVisible] = useState(false);

  const handleGetStarted = () => {
    // setFormVisible(true);

    // animate page scroll to the pricing table
    const pricingSection = document.querySelector("#pricing-table");
    if (pricingSection) {
      pricingSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
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
            <a
              href="https://github.com/alexthegoodman/common-cloud"
              target="_blank"
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full flex items-center"
            >
              Get Started with the Repo <ArrowRight className="ml-2" />
            </a>
            {/* <a
              href="https://www.youtube.com/shorts/LuXI2KxavjU"
              target="_blank"
              className="border border-red-500 text-red-500 hover:bg-red-500/10 px-8 py-3 rounded-full flex items-center"
            >
              Watch Demo <Play className="ml-2 w-4 h-4" />
            </a> */}
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

      {/* Video Showcase Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-500 to-orange-500 text-transparent bg-clip-text">
            See Stunts in Action
          </h2>
          <p className="text-lg text-gray-400">
            Watch real examples created with our animation engine
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative group"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 p-1">
              <div className="relative overflow-hidden rounded-xl bg-black">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto aspect-[16/9] object-cover"
                >
                  <source src="/videos/test1c.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative group"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 p-1">
              <div className="relative overflow-hidden rounded-xl bg-black">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto aspect-[16/9] object-cover"
                >
                  <source src="/videos/test2c.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* <ClientOnly>
        <MosaicCreatorSection />
      </ClientOnly> */}

      <Features />

      {/* <div
        className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl p-12 text-center mb-16 mx-auto"
        style={{ maxWidth: "800px" }}
      >
        <TextAnimationDemo />
      </div> */}

      {/* <SocialProof /> */}

      <ComingSoonSection />

      <Competition />

      {/** Pricing Table */}
      {/* <section className="container mx-auto px-4 py-16">
        <PricingTable />
      </section> */}

      {/** Frequently Asked Questions */}
      <section className="container mx-auto px-4 py-16">
        <FAQ />
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Ready to Start Building?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Clone the repo and start creating professional animations with
            Stunts.
          </p>
          <a
            href="https://github.com/alexthegoodman/common-cloud"
            target="_blank"
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full inline-flex items-center"
          >
            View on GitHub <ShieldChevron className="ml-2" />
          </a>
        </div>
      </section>
    </>
  );
};

export default HomePage;
