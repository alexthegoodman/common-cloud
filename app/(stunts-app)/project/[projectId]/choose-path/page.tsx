"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowRight, Play, PencilSimple } from "@phosphor-icons/react";

export default function ChoosePath() {
  const { t } = useTranslation("common");
  const { projectId } = useParams();
  const router = useRouter();

  const handleFlowChoice = () => {
    router.push(`/project/${projectId}`);
  };

  const handleEditorChoice = () => {
    router.push(`/project/${projectId}/videos`);
  };

  return (
    <React.Suspense fallback={<div>{t("Loading")}...</div>}>
      <ErrorBoundary>
        <ClientOnly>
          <div className="flex flex-col justify-center items-center mx-auto w-[calc(100vw-100px)] md:w-full min-h-[70vh]">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {t("Choose your path")}
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                {t("How would you like to start working on your project?")}
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
              {/* Flow Option */}
              <div className="flex-1 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-4 border-2 border-gray-100 hover:border-blue-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t("Start with Flow")}
                  </h2>
                  <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                    {t(
                      "Use AI to generate content based on your prompt. Upload files, answer questions, and let our AI create your video."
                    )}
                  </p>
                  <button
                    onClick={handleFlowChoice}
                    className="w-full stunts-gradient text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    {t("Start Flow")}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Editor Option */}
              <div className="flex-1 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-4 border-2 border-gray-100 hover:border-green-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <PencilSimple className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t("Go to Editor")}
                  </h2>
                  <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                    {t(
                      "Jump straight into the video editor to create your content manually with full creative control."
                    )}
                  </p>
                  <button
                    onClick={handleEditorChoice}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {t("Open Editor")}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                {t("You can always switch between these options later")}
              </p>
            </div>
          </div>
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}
