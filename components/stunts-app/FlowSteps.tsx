"use client";

import { useTranslation } from "react-i18next";

export const FlowSteps = ({ step = 1 }: { step: number }) => {
  const { t } = useTranslation("flow");

  return (
    <div className="flex flex-row gap-4 mb-6 md:mb-12 text-sm md:text-base">
      <div
        className={`flex flex-row gap-1 ${
          step === 1 ? "text-black" : "text-gray-400"
        }`}
      >
        <span>1.</span>
        <span
          className={
            step === 1
              ? "underline underline-offset-4 md:underline-offset-8"
              : ""
          }
        >
          {t("Your Prompt")}
        </span>
      </div>
      <div
        className={`flex flex-row gap-1 ${
          step === 2 ? "text-black" : "text-gray-400"
        }`}
      >
        <span>2.</span>
        <span
          className={
            step === 2
              ? "underline underline-offset-4 md:underline-offset-8"
              : ""
          }
        >
          {t("Your Content")}
        </span>
      </div>
      <div
        className={`flex flex-row gap-1 ${
          step === 3 ? "text-black" : "text-gray-400"
        }`}
      >
        <span>3.</span>
        <span
          className={
            step === 3
              ? "underline underline-offset-4 md:underline-offset-8"
              : ""
          }
        >
          {t("Intelligent Questions")}
        </span>
      </div>
    </div>
  );
};
