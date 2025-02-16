"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import { ProjectEditor } from "@/components/stunts-app/ProjectEditor";
import React from "react";
import { useParams } from "next/navigation";

export default function Project() {
  const { projectId } = useParams();

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {/* Wrap with Suspense */}
      <ErrorBoundary>
        {/* Error Boundary */}
        <ClientOnly>
          <div className="mx-auto">
            <ProjectEditor projectId={projectId} />
          </div>
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}
