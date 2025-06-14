import { Check } from "@phosphor-icons/react";
import Link from "next/link";
import React, { useEffect } from "react";

const PricingTable = ({ language = "en" }) => {
  let copy = null;

  switch (language) {
    case "en":
      copy = {
        title: "Simple, Transparent Pricing",
        subtitle: "Choose the plan that works for you",
        plans: {
          free: {
            name: "Free",
            price: "$0",
            period: "Forever free",
            features: [
              "Keyframe Generation",
              "Keyframe Management",
              "MP4 Video Import",
              "Text, Shapes, and Images",
              "HD MP4 Export",
              "3 Projects Limit",
            ],
            buttonText: "Get Started Free",
          },
          standard: {
            name: "Standard",
            price: "$2.99",
            period: "per month",
            badge: "GREAT VALUE",
            features: ["Everything in Free", "Unlimited Projects"],
            buttonText: "Coming Soon",
          },
        },
      };
      break;

    case "hi":
      copy = {
        title: "सरल, पारदर्शी प्राइसिंग",
        subtitle: "अपने लिए सही प्लान चुनें",
        plans: {
          free: {
            name: "फ्री",
            price: "$0",
            period: "हमेशा फ्री",
            features: [
              "कीफ्रेम जेनरेशन",
              "कीफ्रेम मैनेजमेंट",
              "MP4 वीडियो इम्पोर्ट",
              "टेक्स्ट, शेप्स और इमेज",
              "HD MP4 एक्सपोर्ट",
              "3 प्रोजेक्ट्स लिमिट",
            ],
            buttonText: "फ्री में शुरू करें",
          },
          standard: {
            name: "स्टैंडर्ड",
            price: "$2.99",
            period: "प्रति महीना",
            badge: "बेहतरीन वैल्यू",
            features: ["फ्री में सब कुछ", "अनलिमिटेड प्रोजेक्ट्स"],
            buttonText: "जल्द आ रहा है",
          },
        },
      };
      break;

    default:
      break;
  }

  return (
    <section className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-white text-center mb-4">
        {copy?.title}
      </h2>
      <p className="text-gray-400 text-center mb-12">{copy?.subtitle}</p>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">
              {copy?.plans.free.name}
            </h3>
            <div className="text-3xl font-bold text-white mb-1">
              {copy?.plans.free.price}
            </div>
            <div className="text-gray-400">{copy?.plans.free.period}</div>
          </div>

          <div className="space-y-4">
            {copy?.plans.free.features.map((feature, index) => (
              <div key={index} className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          <Link
            href="/register"
            className="block text-center mt-8 w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {copy?.plans.free.buttonText}
          </Link>
        </div>

        {/* Standard Plan */}
        <div className="bg-slate-800/50 rounded-xl p-8 border border-amber-500/50 relative">
          <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-xl">
            {copy?.plans.standard.badge}
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">
              {copy?.plans.standard.name}
            </h3>
            <div className="text-3xl font-bold text-white mb-1">
              {copy?.plans.standard.price}
            </div>
            <div className="text-gray-400">{copy?.plans.standard.period}</div>
          </div>

          <div className="space-y-4">
            {copy?.plans.standard.features.map((feature, index) => (
              <div key={index} className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          <button className="mt-8 w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 px-4 rounded-lg transition-colors">
            {copy?.plans.standard.buttonText}
          </button>
        </div>
      </div>
    </section>
  );
};

export default PricingTable;
