"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { FlowSteps } from "@/components/stunts-app/FlowSteps";
import FlowContent from "@/components/stunts-app/FlowContent";

export default function Project() {
  const { projectId, flowId } = useParams();

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {/* Wrap with Suspense */}
      <ErrorBoundary>
        {/* Error Boundary */}
        <ClientOnly>
          <div className="flex flex-col justify-center items-center mx-auto">
            <h1 className="text-3xl text-center mb-12">Add Your Content</h1>
            <FlowSteps step={2} />
            <div className="flex flex-col">
              <FlowContent flowId={flowId as string} />
            </div>
          </div>
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}
