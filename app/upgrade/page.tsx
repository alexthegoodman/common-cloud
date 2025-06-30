"use client";

import { Check, CreditCard, ShieldCheck } from "@phosphor-icons/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useCurrentUser from "@/hooks/useCurrentUser";
import { ClientOnly } from "@/components/ClientOnly";
import { useLocalStorage } from "@uidotdev/usehooks";
import { JwtData } from "@/hooks/useCurrentUser";
import { AuthToken } from "@/fetchers/projects";
import useSWR from "swr";
import { getPlans } from "@/fetchers/plans";

export default function UpgradePage() {
  return (
    <ClientOnly>
      <UpgradeContent />
    </ClientOnly>
  );
}

function UpgradeContent() {
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();

  const { data: user } = useCurrentUser();

  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  const { data: plans, isLoading: plansLoading } = useSWR("plans", () =>
    getPlans()
  );

  const handleUpgrade = async (priceId: string) => {
    if (!user || !authToken?.token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken.token}`,
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    if (!user || !authToken?.token) {
      router.push("/login");
      return;
    }

    setPortalLoading(true);
    try {
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken.token}`,
        },
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Failed to create portal session");
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
    } finally {
      setPortalLoading(false);
    }
  };

  // const plans = [
  //   {
  //     name: "Stunts",
  //     price: "$2.99",
  //     period: "per month",
  //     stripePriceId: "", // You need to set this with your actual Stripe price ID
  //     stripeDevPriceId: "", // You need to set this with your actual Stripe dev price ID
  //     features: [
  //       // "Desktop Application Access",
  //       "Unlimited Projects",
  //       "Advanced Video Editing",
  //       "Premium Export Options",
  //       "Priority Support",
  //       "Regular Updates",
  //     ],
  //     badge: "Most Popular",
  //     highlighted: true,
  //   },
  // ];

  const isSubscribed = user?.subscriptionStatus === "ACTIVE";

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            {isSubscribed ? "Manage Your Subscription" : "Upgrade to Premium"}
          </h1>
          <p className="text-gray-400 text-lg">
            {isSubscribed
              ? "Manage your billing and subscription settings"
              : "Unlock unlimited creativity with our premium features"}
          </p>
        </div>

        {isSubscribed && (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-slate-800/50 rounded-xl p-8 border border-green-500/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Current Plan: {user?.plan?.name || "Premium"}
                  </h3>
                  <p className="text-gray-400">
                    {user?.cancelAtPeriodEnd
                      ? "Cancels at period end"
                      : "Active subscription"}
                  </p>
                  {user?.currentPeriodEnd && (
                    <p className="text-sm text-gray-500">
                      Next billing:{" "}
                      {new Date(user.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center">
                  <ShieldCheck className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {portalLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <CreditCard className="h-5 w-5 mr-2" />
                )}
                {portalLoading ? "Loading..." : "Manage Billing"}
              </button>
            </div>
          </div>
        )}

        {!isSubscribed && (
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Plan */}
              <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Free
                  </h3>
                  <div className="text-3xl font-bold text-white mb-1">$0</div>
                  <div className="text-gray-400">Forever free</div>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    "Keyframe Generation",
                    "Keyframe Management",
                    "MP4 Video Import",
                    "Text, Shapes, and Images",
                    "HD MP4 Export",
                    "3 Projects Limit",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <span className="text-gray-400">Current Plan</span>
                </div>
              </div>

              {/* Premium Plan */}
              {plans?.plans.map((plan, index) => (
                <div
                  key={index}
                  className={`bg-slate-800/50 rounded-xl p-8 border relative`}
                >
                  {/* {plan.badge && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                      {plan.badge}
                    </div>
                  )} */}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="text-3xl font-bold text-white mb-1">
                      {/* {plan.price} */}${plan.price / 100}
                    </div>
                    <div className="text-gray-400">Per Month</div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {/* {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))} */}
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-300">Everything in free</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-300">Unlimited Projects</span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleUpgrade(
                        process.env.NODE_ENV === "production"
                          ? plan.stripePriceId
                          : plan.stripeDevPriceId
                      )
                    }
                    disabled={loading || !plan.stripePriceId}
                    className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-black`}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                    ) : (
                      <CreditCard className="h-5 w-5 mr-2" />
                    )}
                    {loading
                      ? "Processing..."
                      : !plan.stripePriceId
                      ? "Coming Soon"
                      : "Upgrade Now"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto mt-16 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">
            Secure Payment Processing
          </h3>
          <p className="text-gray-400 mb-6">
            Your payment information is processed securely by Stripe. We never
            store your payment details.
          </p>
          <div className="flex items-center justify-center space-x-4 text-gray-500">
            <ShieldCheck className="h-6 w-6" />
            <span>SSL Encrypted</span>
            <span>•</span>
            <span>PCI Compliant</span>
            <span>•</span>
            <span>Cancel Anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
