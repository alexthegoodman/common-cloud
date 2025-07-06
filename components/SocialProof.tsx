"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, TrendUp, Users, Play } from "@phosphor-icons/react";

interface SocialProofProps {
  language?: string;
}

export default function SocialProof({ language = "en" }: SocialProofProps) {
  let copy = null;

  switch (language) {
    case "en":
      copy = {
        title: "Trusted by 600+ Content Creators",
        subtitle: "Join creators who are already getting results",
        stats: [
          {
            number: "600+",
            label: "Active Creators",
            icon: Users,
          },
          {
            number: "100+",
            label: "Videos Created",
            icon: Play,
          },
          {
            number: "Thousands",
            label: "Total Views Generated",
            icon: TrendUp,
          },
        ],
        testimonials: [
          {
            text: "My engagement went from 500 to 15K views per video after using Stunts. The keyframe automation is game-changing!",
            author: "Priya M.",
            role: "Fashion Creator",
            rating: 5,
          },
          {
            text: "Finally, professional animations without the learning curve. Perfect for my product demos and brand partnerships.",
            author: "Arjun K.",
            role: "Tech Reviewer",
            rating: 5,
          },
          {
            text: "I use it for both my viral content and private family videos. The quality is incredible for the price.",
            author: "Sneha R.",
            role: "Lifestyle Creator",
            rating: 5,
          },
        ],
        ctaText: "Join the community creating viral content",
      };
      break;

    case "hi":
      copy = {
        title: "600+ कंटेंट क्रिएटर्स का भरोसा",
        subtitle: "उन क्रिएटर्स से जुड़ें जो पहले से ही रिजल्ट्स पा रहे हैं",
        stats: [
          {
            number: "600+",
            label: "एक्टिव क्रिएटर्स",
            icon: Users,
          },
          {
            number: "100+",
            label: "वीडियो बनाए गए",
            icon: Play,
          },
          {
            number: "हजारों",
            label: "कुल व्यूज़ जेनरेट किए गए",
            icon: TrendUp,
          },
        ],
        testimonials: [
          {
            text: "Stunts यूज़ करने के बाद मेरी एंगेजमेंट 500 से 15K व्यूज़ पर वीडियो हो गई। कीफ्रेम ऑटोमेशन गेम-चेंजिंग है!",
            author: "प्रिया एम.",
            role: "फैशन क्रिएटर",
            rating: 5,
          },
          {
            text: "आखिरकार, लर्निंग कर्व के बिना प्रोफेशनल एनिमेशन। मेरे प्रोडक्ट डेमोस और ब्रांड पार्टनरशिप के लिए परफेक्ट।",
            author: "अर्जुन के.",
            role: "टेक रिव्यूअर",
            rating: 5,
          },
          {
            text: "मैं इसे अपने वायरल कंटेंट और प्राइवेट फैमिली वीडियो दोनों के लिए यूज़ करती हूं। प्राइस के लिए क्वालिटी अविश्वसनीय है।",
            author: "स्नेहा आर.",
            role: "लाइफस्टाइल क्रिएटर",
            rating: 5,
          },
        ],
        ctaText: "वायरल कंटेंट बनाने वाली कम्युनिटी से जुड़ें",
      };
      break;

    default:
      break;
  }

  if (!copy) return null;

  return (
    <section className="container mx-auto px-4 py-16 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">{copy.title}</h2>
        <p className="text-gray-400 text-lg">{copy.subtitle}</p>
      </div>

      {/* Stats */}
      {/* <div className="grid md:grid-cols-3 gap-8 mb-16">
        {copy.stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <div className="bg-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <stat.icon className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {stat.number}
            </div>
            <div className="text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </div> */}

      {/* Testimonials */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {copy.testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50"
          >
            <div className="flex items-center mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 text-yellow-400 fill-current"
                />
              ))}
            </div>
            <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
            <div className="border-t border-slate-700 pt-4">
              <div className="font-semibold text-white">
                {testimonial.author}
              </div>
              <div className="text-gray-400 text-sm">{testimonial.role}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-gray-300 text-lg mb-6">{copy.ctaText}</p>
        <div className="flex justify-center gap-4">
          <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105">
            {language === "hi" ? "आज ही शुरू करें" : "Start Creating Today"}
          </button>
          <button className="border border-red-500 text-red-500 hover:bg-red-500/10 px-8 py-3 rounded-full font-semibold transition-all">
            {language === "hi" ? "कम्युनिटी देखें" : "See Community"}
          </button>
        </div>
      </div>
    </section>
  );
}
