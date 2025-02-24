"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import React from "react";
import { useParams } from "next/navigation";
import { CreateIcon } from "@/components/stunts-app/icon";
import { Check, Plus } from "@phosphor-icons/react";

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
            <div className="flex flex-col">
              <div className="flex flex-row gap-2 mb-4">
                <div className="flex flex-row items-center border border-slate-500 rounded-full cursor-pointer">
                  <div className="border border-slate-500 border-l-none p-1 rounded-full bg-green-500 text-white">
                    {/* <CreateIcon icon="check" size="24px" /> */}
                    <Check weight="regular" size="24px" />
                  </div>
                  <div className="pl-2 pr-3">
                    <span className="text-sm">Common Brand Kit</span>
                  </div>
                </div>
                <div className="flex flex-row items-center border border-slate-500 rounded-full cursor-pointer">
                  {/* <div className="border border-black border-l-none p-1 rounded-full">
                    <CreateIcon icon="check" size="24px" />
                  </div> */}
                  <div className="pl-3 pr-3">
                    <span className="text-sm">Stunts Branding</span>
                  </div>
                </div>
                <div className="flex flex-row items-center border border-slate-500 rounded-full cursor-pointer">
                  {/* <div className="border border-black border-l-none p-1 rounded-full">
                    <CreateIcon icon="check" size="24px" />
                  </div> */}
                  <div className="pl-3 pr-3">
                    <span className="text-sm">Default Brand Kit</span>
                  </div>
                </div>
                <div className="flex flex-row items-center rounded-full cursor-pointer">
                  <div className="p-1 rounded-full bg-indigo-500 text-white">
                    {/* <CreateIcon icon="check" size="24px" /> */}
                    <Plus weight="regular" size="24px" />
                  </div>
                </div>
              </div>
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
