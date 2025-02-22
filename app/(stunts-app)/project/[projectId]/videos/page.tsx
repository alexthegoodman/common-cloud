"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import { VideoEditor } from "@/components/stunts-app/VideoEditor";
import React from "react";
import { useParams } from "next/navigation";

export default function Videos() {
  const { projectId } = useParams();

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {/* Wrap with Suspense */}
      <ErrorBoundary>
        {/* Error Boundary */}
        <ClientOnly>
          <div className="mx-auto">
            <VideoEditor projectId={projectId} />
          </div>
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}
