"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import { VideoEditor } from "@/components/stunts-app/VideoEditor";
import React from "react";
import { useParams } from "next/navigation";
import VideoStartupSettings from "@/components/stunts-app/VideoStartupSettings";
import { useTranslation } from "react-i18next";

export default function Videos() {
  const { t } = useTranslation("common");

  const { projectId } = useParams();

  return (
    <React.Suspense fallback={<div>{t("Loading")}...</div>}>
      {/* Wrap with Suspense */}
      <ErrorBoundary>
        {/* Error Boundary */}
        <ClientOnly>
          {/* <div className="mx-auto">
            <VideoEditor projectId={projectId} />
          </div> */}
          <VideoStartupSettings />
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}
