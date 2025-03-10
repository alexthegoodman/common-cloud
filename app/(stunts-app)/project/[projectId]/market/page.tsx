"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import React from "react";
import { useParams } from "next/navigation";
import AppMarketplace from "@/components/stunts-app/Marketplace";

export default function Slides() {
  const { projectId } = useParams();

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {/* Wrap with Suspense */}
      <ErrorBoundary>
        {/* Error Boundary */}
        <ClientOnly>
          <div className="mx-auto">
            <AppMarketplace />
          </div>
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}
