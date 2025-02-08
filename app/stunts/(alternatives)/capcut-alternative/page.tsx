"use client";

import React from "react";
import {
  ArrowRight,
  Star,
  MagicWand,
  Sparkle,
  Video,
  Palette,
  Target,
} from "@phosphor-icons/react";
import Header from "@/components/Header";
import Link from "next/link";

const CapCutAlternative = () => {
  const benefits = [
    {
      icon: Star,
      title: "Professional Motion Graphics",
      description:
        "Create high-end animations that go beyond basic video effects. Take your content from social-ready to professionally polished with advanced motion tools.",
    },
    {
      icon: MagicWand,
      title: "Intelligent Animation",
      description:
        "Our smart path generation system creates smooth, natural-looking motion automatically. No more robotic movements or template-looking effects.",
    },
    {
      icon: Video,
      title: "Enhanced Video Content",
      description:
        "Import your videos and transform them with professional motion graphics. Perfect for creators who want to add premium animated elements to their content.",
    },
    {
      icon: Target,
      title: "Advanced Screen Recording",
      description:
        "Capture screens and mouse movements with intelligent zoom features - ideal for tutorials, product demos, and tech reviews that stand out.",
    },
    {
      icon: Palette,
      title: "Creative Control",
      description:
        "Access 35+ professional fonts, versatile shape tools, and powerful animation capabilities. Create unique effects that set your content apart.",
    },
    {
      icon: Sparkle,
      title: "Premium Results",
      description:
        "Deliver content that looks professionally produced. Perfect for creators who want their videos to have that extra polish of high-end motion graphics.",
    },
  ];

  return (
    <>
      <Header showLogo={true} />

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <img
            src="/screen3.png"
            alt="Stunts Screenshot"
            className="max-w-[700px] w-full mx-auto mb-8 rounded"
          />
          <h1 className="text-4xl font-bold text-white mb-4">
            Looking for a Professional CapCut Alternative?
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Elevate your content with Stunts - where professional motion
            graphics meet intuitive design. Perfect for creators ready to take
            their videos to the next level.
          </p>
        </div>

        {/* Why Switch Section */}
        <div className="bg-slate-800/30 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Why Consider an Alternative?
          </h2>
          <div className="text-gray-400 space-y-4">
            <p>
              While CapCut is great for quick video edits, professional creators
              often need more advanced motion graphics capabilities to stand out
              in today's competitive landscape.
            </p>
            <p>
              Stunts provides the professional motion graphics tools you need
              while maintaining an intuitive workflow that makes creating
              premium content effortless.
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-slate-800/50 p-6 rounded-xl">
              <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <benefit.icon size={24} className="text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                {benefit.title}
              </h3>
              <p className="text-gray-400">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Ideal For Section */}
        <div className="bg-slate-800/30 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Make the Switch to Stunts If You Need:
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-gray-400">✓ Professional motion graphics</p>
              <p className="text-gray-400">✓ Advanced screen recordings</p>
              <p className="text-gray-400">✓ Custom animated effects</p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-400">✓ High-end product demos</p>
              <p className="text-gray-400">✓ Professional tutorial content</p>
              <p className="text-gray-400">✓ Premium brand content</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-red-500/10 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Ready to Create Professional-Grade Content?
          </h2>
          <p className="text-gray-400 mb-6">
            Join creators who have elevated their content with professional
            motion graphics using Stunts.
          </p>
          <Link
            href="/register"
            className="bg-red-500 w-[200px] justify-center hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
          >
            Try Stunts Free <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </>
  );
};

export default CapCutAlternative;
