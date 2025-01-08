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

const HomePage = () => {
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
            <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full flex items-center">
              Get Started <ShieldChevron className="ml-2" />
            </button>
            <button className="border border-red-500 text-red-500 hover:bg-red-500/10 px-8 py-3 rounded-full flex items-center">
              Watch Demo <Play className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 p-6 rounded-xl">
            <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <MagicWand className="text-red-500" />
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
            <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Lightning className="text-red-500" />
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
            <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Video className="text-red-500" />
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
          <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full inline-flex items-center">
            Start Creating <ShieldChevron className="ml-2" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
