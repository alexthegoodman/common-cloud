import { Check } from "@phosphor-icons/react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PricingTable = ({ language = "en" }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  let copy = null;

  const handleSubscription = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Get available plans
      const plansResponse = await fetch("/api/plans/all");
      const plansData = await plansResponse.json();

      if (!plansData.plans || plansData.plans.length === 0) {
        throw new Error("No subscription plans available");
      }

      const plan = plansData.plans[0];
      const priceId =
        process.env.NODE_ENV === "production"
          ? plan.stripePriceId
          : plan.stripeDevPriceId;

      if (!priceId) {
        throw new Error("Subscription plan not configured");
      }

      // Create checkout session
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          priceId: priceId,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  switch (language) {
    case "en":
      copy = {
        title: "Start Your Creative Journey",
        subtitle: "Get unlimited access to all features for just $0.99/month",
        features: [
          "Unlimited Projects",
          "Advanced Video Editing",
          "Keyframe Generation & Management",
          "MP4 Video Import & Export",
          "Text, Shapes, and Images",
          "HD Export Quality",
          "Priority Support",
        ],
        emailPlaceholder: "Enter your email address",
        buttonText: "Proceed to Checkout",
        priceText: "$0.99/month",
        badge: "SPECIAL LAUNCH PRICE",
      };
      break;

    case "hi":
      copy = {
        title: "अपनी क्रिएटिव यात्रा शुरू करें",
        subtitle: "सिर्फ $0.99/महीना में सभी फीचर्स का असीमित एक्सेस पाएं",
        features: [
          "अनलिमिटेड प्रोजेक्ट्स",
          "एडवांस्ड वीडियो एडिटिंग",
          "कीफ्रेम जेनरेशन और मैनेजमेंट",
          "MP4 वीडियो इम्पोर्ट और एक्सपोर्ट",
          "टेक्स्ट, शेप्स और इमेज",
          "HD एक्सपोर्ट क्वालिटी",
          "प्राथमिकता सपोर्ट",
        ],
        emailPlaceholder: "अपना ईमेल पता दर्ज करें",
        buttonText: "चेकआउट पर जाएं",
        priceText: "$0.99/महीना",
        badge: "स्पेशल लॉन्च प्राइस",
      };
      break;

    default:
      break;
  }

  return (
    <section className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">{copy?.title}</h2>
        <p className="text-gray-400 text-lg">{copy?.subtitle}</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/50 rounded-xl p-8 border border-amber-500/50 relative">
          <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-xl">
            {copy?.badge}
          </div>

          <div className="text-center mb-8">
            <div className="text-5xl font-bold text-white mb-2">
              {copy?.priceText}
            </div>
            <p className="text-gray-400">Cancel anytime • No setup fees</p>
          </div>

          <div className="space-y-4 mb-8">
            {copy?.features.map((feature, index) => (
              <div key={index} className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubscription} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={copy?.emailPlaceholder}
                required
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900 placeholder:text-slate-400"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </span>
              ) : (
                copy?.buttonText
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>Secure payment processing by Stripe</p>
            <p>🔒 Your data is protected and encrypted</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingTable;
