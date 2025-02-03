"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Play,
  ShieldChevron,
  MagicWand,
  Lightning,
  Clock,
  Video,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

const HomePage = () => {
  const router = useRouter();

  const clickPrimary = () => {
    router.push("/stunts/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-slate-900">
      {/* Hero Section */}
      <header className="container mx-auto px-4 pt-24 pb-16">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-6xl font-bold mb-6">Common</h1>
          </motion.div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-green-500 to-yellow-500 text-transparent bg-clip-text">
            Valuable Products for Regular People
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Common innovates at the edge of technology to produce affordable
            products for normal people.
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full flex items-center"
              onClick={clickPrimary}
            >
              Try Stunts <ShieldChevron className="ml-2" />
            </button>
            <a
              href="https://www.youtube.com/@madebycommon"
              target="_blank"
              className="border border-green-500 text-green-500 hover:bg-green-500/10 px-8 py-3 rounded-full flex items-center"
            >
              Watch YouTube <Play className="ml-2 w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Features Section */}
      {/* <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 p-6 rounded-xl">
            <div className="bg-green-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <MagicWand className="text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              Smart Path Generation
            </h3>
            <p className="text-gray-400">
              Automatically generate smooth motion paths with our intelligent
              keyframe system.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl">
            <div className="bg-green-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Lightning className="text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              Lightning Fast
            </h3>
            <p className="text-gray-400">
              Create professional animations in minutes instead of hours with
              our streamlined workflow.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl">
            <div className="bg-green-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Video className="text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              Your Content
            </h3>
            <p className="text-gray-400">
              Import your own media and transform it with our powerful animation
              tools.
            </p>
          </div>
        </div>
      </section> */}

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-green-500/10 to-yellow-500/10 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Looking to connect?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            We are pleased to make new friends.
          </p>
          <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full inline-flex items-center">
            Contact Common <ShieldChevron className="ml-2" />
          </button>
        </div>
      </section>

      {/* Footer */}

      <Footer />
    </div>
  );
};

export default HomePage;
