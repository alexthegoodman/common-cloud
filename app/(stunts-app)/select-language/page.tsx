"use client";

import { ClientOnly } from "@/components/ClientOnly";
import LanguagePicker from "@/components/LanguagePicker";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import { ProjectsList } from "@/components/stunts-app/ProjectsList";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Projects() {
  const { t } = useTranslation("common");

  const router = useRouter();

  return (
    <React.Suspense fallback={<div>{t("Loading")}...</div>}>
      {/* Wrap with Suspense */}
      <ErrorBoundary>
        {/* Error Boundary */}
        <ClientOnly>
          <div className="container mx-auto py-4">
            <LanguagePicker />
          </div>
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}
