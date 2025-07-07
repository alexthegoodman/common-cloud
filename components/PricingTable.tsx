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
        title: "Choose Your Plan",
        subtitle: "Start free, upgrade when you're ready",
        freeTier: {
          name: "Free",
          price: "$0",
          period: "forever",
          features: [
            "Up to 3 projects",
            "Basic video editing",
            "Standard export quality",
            "Community support"
          ],
          buttonText: "Get Started Free"
        },
        proTier: {
          name: "Pro",
          price: "$0.99",
          period: "per month",
          features: [
            "Unlimited projects",
            "Advanced video editing",
            "Premium export options",
            "Priority support",
            "AI-powered keyframes",
            "Professional templates"
          ],
          buttonText: "Upgrade to Pro"
        },
        emailPlaceholder: "Enter your email address",
      };
      break;

    case "hi":
      copy = {
        title: "अपना प्लान चुनें",
        subtitle: "फ्री में शुरू करें, तैयार हों तो अपग्रेड करें",
        freeTier: {
          name: "फ्री",
          price: "$0",
          period: "हमेशा के लिए",
          features: [
            "3 प्रोजेक्ट्स तक",
            "बेसिक वीडियो एडिटिंग",
            "स्टैंडर्ड एक्सपोर्ट क्वालिटी",
            "कम्युनिटी सपोर्ट"
          ],
          buttonText: "फ्री में शुरू करें"
        },
        proTier: {
          name: "Pro",
          price: "$0.99",
          period: "प्रति महीने",
          features: [
            "अनलिमिटेड प्रोजेक्ट्स",
            "एडवांस्ड वीडियो एडिटिंग",
            "प्रीमियम एक्सपोर्ट विकल्प",
            "प्राथमिकता सपोर्ट",
            "AI-पावर्ड कीफ्रेम्स",
            "प्रोफेशनल टेम्प्लेट्स"
          ],
          buttonText: "Pro में अपग्रेड करें"
        },
        emailPlaceholder: "अपना ईमेल पता दर्ज करें",
      };
      break;

    default:
      break;
  }

  return (
    <section className="container mx-auto px-4" id="pricing-table">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">{copy?.title}</h2>
        <p className="text-gray-400 text-lg">{copy?.subtitle}</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div className="bg-slate-800/50 rounded-xl p-8 border border-gray-600">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">
                {copy?.freeTier.name}
              </h3>
              <div className="text-4xl font-bold text-white mb-2">
                {copy?.freeTier.price}
              </div>
              <p className="text-gray-400">{copy?.freeTier.period}</p>
            </div>

            <div className="space-y-4 mb-8">
              {copy?.freeTier.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); router.push('/register'); }} className="space-y-4">
              <button
                type="submit"
                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
              >
                {copy?.freeTier.buttonText}
              </button>
            </form>
          </div>

          {/* Pro Tier */}
          <div className="bg-slate-800/50 rounded-xl p-8 border border-amber-500/50 relative">
            <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-xl">
              POPULAR
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">
                {copy?.proTier.name}
              </h3>
              <div className="text-4xl font-bold text-white mb-2">
                {copy?.proTier.price}
              </div>
              <p className="text-gray-400">{copy?.proTier.period}</p>
              <p className="text-gray-500 text-sm mt-1">
                Cancel anytime • No setup fees
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {copy?.proTier.features.map((feature, index) => (
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
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </span>
                ) : (
                  copy?.proTier.buttonText
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              <p>Secure payment processing by Stripe</p>
              <p>🔒 Your data is protected and encrypted</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingTable;