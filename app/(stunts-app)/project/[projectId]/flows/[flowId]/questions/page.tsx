"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { FlowSteps } from "@/components/stunts-app/FlowSteps";
import FlowQuestions from "@/components/stunts-app/FlowQuestions";

export default function Questions() {
  const { projectId, flowId } = useParams();

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {/* Wrap with Suspense */}
      <ErrorBoundary>
        {/* Error Boundary */}
        <ClientOnly>
          <div className="flex flex-col justify-center items-center mx-auto">
            <h1 className="text-3xl text-center mb-12">Answer Questions</h1>
            <FlowSteps step={3} />
            <div className="flex flex-col">
              <FlowQuestions
                projectId={projectId as string}
                flowId={flowId as string}
              />
            </div>
          </div>
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}
