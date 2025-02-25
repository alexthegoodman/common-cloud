"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { CreateIcon } from "@/components/stunts-app/icon";
import { Check, Plus } from "@phosphor-icons/react";
import { BrandKitList } from "@/components/stunts-app/BrandKitList";

export default function Project() {
  const { projectId } = useParams();

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {/* Wrap with Suspense */}
      <ErrorBoundary>
        {/* Error Boundary */}
        <ClientOnly>
          <div className="flex flex-col justify-center items-center mx-auto">
            <h1 className="text-3xl text-center mb-12">Welcome to Hub</h1>
            <div className="flex flex-row gap-4 mb-12">
              <div className="flex flex-row gap-1">
                <span>1.</span>
                <span className="underline underline-offset-8">
                  Your Prompt
                </span>
              </div>
              <div className="flex flex-row gap-1 text-gray-400">
                <span>2.</span>
                <span>Your Content</span>
              </div>
              <div className="flex flex-row gap-1 text-gray-400">
                <span>3.</span>
                <span>Intelligent Questions</span>
              </div>
            </div>
            <div className="flex flex-col">
              <BrandKitList />
              <div className="flex flex-col justify-center items-center mx-auto w-[600px] rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                <textarea
                  className="w-full p-4 rounded-[15px] rounded-b-none"
                  rows={4}
                  placeholder="Let's create marketing and sales materials for Common's dog food campaign"
                ></textarea>
                <button className="w-full stunts-gradient rounded-[15px] rounded-t-none text-white p-2 px-4">
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
