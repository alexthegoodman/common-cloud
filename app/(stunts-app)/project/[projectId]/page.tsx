"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CreateIcon } from "@/components/stunts-app/icon";
import { Check, Plus } from "@phosphor-icons/react";
import { BrandKitList } from "@/components/stunts-app/BrandKitList";
import { FlowSteps } from "@/components/stunts-app/FlowSteps";
import { createFlow } from "@/fetchers/flows";
import { AuthToken } from "@/fetchers/projects";
import { useLocalStorage } from "@uidotdev/usehooks";

export default function Project() {
  const { projectId } = useParams();
  const router = useRouter();
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

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
          <div className="flex flex-col justify-center items-center mx-auto">
            <h1 className="text-3xl text-center mb-12">Welcome to Hub</h1>
            <FlowSteps step={1} />
            <div className="flex flex-col">
              <BrandKitList />
              <div className="flex flex-col justify-center items-center mx-auto w-[600px] rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
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
