"use client";

import { ClientOnly } from "@/components/ClientOnly";
import OnboardingCarousel from "@/components/OnboardingCarousel";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import React from "react";
import { useTranslation } from "react-i18next";

export default function OnboardingCarouselPage() {
  const { t } = useTranslation("common");

  return (
    <React.Suspense fallback={<div>{t("Loading")}...</div>}>
      <ErrorBoundary>
        <ClientOnly>
          <OnboardingCarousel />
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}