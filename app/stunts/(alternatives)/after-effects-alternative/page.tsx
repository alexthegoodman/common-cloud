"use client";

import React from "react";
import {
  ArrowRight,
  MagicWand,
  Timer,
  Brain,
  Laptop,
  Users,
  Rocket,
} from "@phosphor-icons/react";
import Header from "@/components/Header";
import Link from "next/link";

const AfterEffectsAlternative = () => {
  const benefits = [
    {
      icon: MagicWand,
      title: "Smart Path Generation",
      description:
        "Automatically create smooth, natural-looking motion paths without the complexity of manual keyframing. Say goodbye to the template look common in basic animations.",
    },
    {
      icon: Timer,
      title: "Faster Learning Curve",
      description:
        "Get started quickly with an intuitive interface designed for modern creators. Essential tools are readily accessible without deep menu diving.",
    },
    {
      icon: Brain,
      title: "Intelligent Workflow",
      description:
        "Built-in screen and mouse capture with automatic zoom capabilities – perfect for creating product demos and tutorials without third-party plugins.",
    },
    {
      icon: Laptop,
      title: "Professional Toolkit",
      description:
        "Access all essential tools including advanced text editing with 35+ professional fonts, versatile shape tools, and robust image manipulation.",
    },
    {
      icon: Users,
      title: "Perfect for Teams",
      description:
        "Ideal for content creators, marketing professionals, YouTubers, and motion designers looking for efficient workflows without sacrificing quality.",
    },
    {
      icon: Rocket,
      title: "Professional Output",
      description:
        "Deliver high-quality animations with our professional rendering engine and support for industry-standard formats.",
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
            Looking for an After Effects Alternative?
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience the perfect balance of power and simplicity with Stunts.
            Create professional motion graphics without the complexity.
          </p>
        </div>

        {/* Why Switch Section */}
        <div className="bg-slate-800/30 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Why Consider an Alternative?
          </h2>
          <div className="text-gray-400 space-y-4">
            <p>
              While Adobe After Effects has long been an industry standard, many
              creators face challenges with its complex interface, subscription
              pricing, and steep learning curve.
            </p>
            <p>
              Stunts offers a fresh approach - professional motion graphics
              tools that both beginners and experts can master quickly.
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

        {/* CTA Section */}
        <div className="bg-red-500/10 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Ready to Try a More Intuitive Approach?
          </h2>
          <p className="text-gray-400 mb-6">
            Join creators who have made the switch to Stunts and experience the
            difference.
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

export default AfterEffectsAlternative;
