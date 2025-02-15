"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import { ProjectsList } from "@/components/stunts-app/ProjectsList";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function Projects() {
  const router = useRouter();

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {/* Wrap with Suspense */}
      <ErrorBoundary>
        {/* Error Boundary */}
        <ClientOnly>
          <div className="container mx-auto py-4">
            <div className="flex flex-row gap-2 justify-between w-full">
              <h1 className="text-lg">Projects</h1>
              <button
                onClick={() => router.push("/create-project")}
                className="group relative w-lg flex justify-center py-2 px-4 border border-transparent
                text-sm font-medium rounded-md text-white stunts-gradient 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>
            <ProjectsList />
          </div>
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}
