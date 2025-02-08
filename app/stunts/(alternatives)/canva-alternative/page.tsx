"use client";

import React from "react";
import {
  ArrowRight,
  Gauge,
  Palette,
  Layout,
  Sparkle,
  BoxArrowUp,
  FilmReel,
} from "@phosphor-icons/react";
import Header from "@/components/Header";
import Link from "next/link";

const CanvaAlternative = () => {
  const benefits = [
    {
      icon: Sparkle,
      title: "Beyond Static Design",
      description:
        "Take your designs to the next level with professional motion graphics. Transform static presentations and social media content into engaging animations.",
    },
    {
      icon: Gauge,
      title: "Professional Animation Tools",
      description:
        "Access powerful motion design features while maintaining an intuitive interface. Create smooth animations with our smart path generation system.",
    },
    {
      icon: BoxArrowUp,
      title: "Import Your Content",
      description:
        "Easily import your existing designs and media. Transform static images and text into dynamic motion graphics with professional-grade tools.",
    },
    {
      icon: Palette,
      title: "Creative Freedom",
      description:
        "Break free from templates with 35+ professional fonts, versatile shape tools, and powerful animation capabilities that let your creativity shine.",
    },
    {
      icon: FilmReel,
      title: "Video Enhancement",
      description:
        "Take your video content further with desktop-class performance. Add professional motion graphics and effects to your existing footage.",
    },
    {
      icon: Layout,
      title: "Screen Capture Plus",
      description:
        "Create stunning product demos and tutorials with built-in screen recording and intelligent mouse tracking with beautiful automated zooms.",
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
            Ready to Move Beyond Canva?
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Elevate your content with Stunts - professional motion graphics made
            simple. Perfect for creators who want to add dynamic movement to
            their designs.
          </p>
        </div>

        {/* Why Switch Section */}
        <div className="bg-slate-800/30 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Why Consider an Alternative?
          </h2>
          <div className="text-gray-400 space-y-4">
            <p>
              While Canva excels at static designs, modern content demands
              movement. When you're ready to bring your designs to life with
              professional animation, Stunts provides the perfect next step.
            </p>
            <p>
              Maintain the intuitive workflow you love while accessing powerful
              motion graphics tools that will set your content apart.
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

        {/* Use Cases Section */}
        <div className="bg-slate-800/30 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Perfect for Creators Who Need:
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-gray-400">✓ Animated social media content</p>
              <p className="text-gray-400">✓ Dynamic presentation slides</p>
              <p className="text-gray-400">✓ Product demonstrations</p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-400">✓ Motion graphics for videos</p>
              <p className="text-gray-400">✓ Tutorial content</p>
              <p className="text-gray-400">✓ Professional animations</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-red-500/10 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Take Your Designs to the Next Level
          </h2>
          <p className="text-gray-400 mb-6">
            Join creators who have discovered the power of professional motion
            graphics with Stunts.
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

export default CanvaAlternative;
