"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CreateIcon } from "@/components/stunts-app/icon";
import { Check, Plus, X } from "@phosphor-icons/react";
import { BrandKitList } from "@/components/stunts-app/BrandKitList";
import { FlowSteps } from "@/components/stunts-app/FlowSteps";
import { createFlow } from "@/fetchers/flows";
import { AuthToken } from "@/fetchers/projects";
import { useLocalStorage } from "@uidotdev/usehooks";

export default function Project() {
  const { projectId } = useParams();
  const router = useRouter();
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);
  // Store hub alert visible state in local storage
  const [hubAlertVisible, setHubAlertVisible] = useLocalStorage<boolean>(
    "hub-alert-visible",
    true
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>("");

  const handleCreateFlow = async () => {
    if (!authToken?.token || !prompt) {
      return;
    }

    setLoading(true);

    const flow = await createFlow(authToken?.token, prompt, null);

    router.push(`/project/${projectId}/flows/${flow.newFlow.id}/content`);
  };

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {/* Wrap with Suspense */}
      <ErrorBoundary>
        {/* Error Boundary */}
        <ClientOnly>
          <div className="flex flex-col justify-center items-center mx-auto w-[calc(100vw-100px)] md:w-full">
            {/* Alert explaining hub */}
            {hubAlertVisible && (
              <section className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-6 w-full md:w-[600px]">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Welcome to the Hub!</h2>

                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setHubAlertVisible(false)}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex items-center">
                  <Check className="mr-2" />
                  <span className="text-sm">
                    Welcome to the Hub! Here you can create and manage your
                    flows, which are the quick and easy way to generate
                    marketing and sales materials that are tailored and
                    personalized. Alternatively, head straight to the area of
                    your choice using the navigation on the left.
                  </span>
                </div>
              </section>
            )}

            <h1 className="text-3xl text-center mb-12">Welcome to Hub</h1>
            <FlowSteps step={1} />
            <div className="flex flex-col p-1 md:p-0 w-full">
              <BrandKitList />
              <div className="flex flex-col justify-center items-center mx-auto w-full md:w-[600px] rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                <textarea
                  className="w-full p-4 rounded-[15px] rounded-b-none"
                  rows={4}
                  placeholder="Let's create marketing and sales materials for Common's dog food campaign"
                  onChange={(e) => setPrompt(e.target.value)}
                ></textarea>
                <button
                  className="w-full stunts-gradient rounded-[15px] rounded-t-none text-white p-2 px-4"
                  onClick={handleCreateFlow}
                  disabled={loading}
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}
