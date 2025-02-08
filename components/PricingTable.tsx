import { Check } from "@phosphor-icons/react";
import Link from "next/link";
import React, { useEffect } from "react";

const PricingTable = () => {
  return (
    <section className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-white text-center mb-4">
        Simple, Transparent Pricing
      </h2>
      <p className="text-gray-400 text-center mb-12">
        Choose the plan that works for you
      </p>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">Free</h3>
            <div className="text-3xl font-bold text-white mb-1">$0</div>
            <div className="text-gray-400">Forever free</div>
          </div>

          <div className="space-y-4">
            {/* <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">
                Access to Web app (great for mobile)
              </span>
            </div> */}
            {/* <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">
                100 AI generations per month
              </span>
            </div> */}
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">Keyframe Generation</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">Keyframe Management</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">MP4 Video Import</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">Text, Shapes, and Images</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">HD MP4 Export</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">3 Projects Limit</span>
            </div>
            {/* <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">Basic templates</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">Up to 3 projects</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">Core editing features</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">720p export quality</span>
            </div> */}
          </div>

          <Link
            href="/register"
            className="block text-center mt-8 w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Get Started Free
          </Link>
        </div>

        {/* Standard Plan */}
        <div className="bg-slate-800/50 rounded-xl p-8 border border-amber-500/50 relative">
          <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-xl">
            GREAT VALUE
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">Standard</h3>
            <div className="text-3xl font-bold text-white mb-1">$6.99</div>
            <div className="text-gray-400">per month</div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">Everything in Free</span>
            </div>
            {/* <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">
                Nearly unlimited AI generations per month
              </span>
            </div> */}
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">Unlimited Projects</span>
            </div>
            {/* <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">
                Access to Windows app (desktop-class performance)
              </span>
            </div> */}
            {/* <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">Everything in Free</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">Unlimited projects</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">Advanced editing tools</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">4K export quality</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">Priority support</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-300">Custom templates</span>
            </div> */}
          </div>

          <button className="mt-8 w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 px-4 rounded-lg transition-colors">
            Coming Soon
          </button>
        </div>
      </div>
    </section>
  );
};

export default PricingTable;
