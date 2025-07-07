"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CreateIcon } from "@/components/stunts-app/icon";
import { Check, Plus, X } from "@phosphor-icons/react";
import { BrandKitList } from "@/components/stunts-app/BrandKitList";
import { FlowSteps } from "@/components/stunts-app/FlowSteps";
import { createFlow } from "@/fetchers/flows";
import { AuthToken, getSingleProject } from "@/fetchers/projects";
import { useLocalStorage } from "@uidotdev/usehooks";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import useSWR from "swr";

export default function Project() {
  const { t } = useTranslation("flow");

  const { projectId } = useParams();
  const router = useRouter();
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);
  // Store hub alert visible state in local storage
  const [hubAlertVisible, setHubAlertVisible] = useLocalStorage<boolean>(
    "hub-alert-visible",
    true
  );

  const {
    data: project,
    isLoading,
    error,
  } = useSWR(`project-${projectId}`, () =>
    getSingleProject(authToken?.token || "", projectId as string)
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>("");

  // Add a ref and useEffect to focus immediately
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      if (!textareaRef.current || !project || isLoading || error) {
        return;
      }

      let projectName = project?.project?.name as string;

      textareaRef.current?.focus();
      textareaRef.current.value = projectName;
      setPrompt(projectName);
    }, 250);
    return () => clearTimeout(timer);
  }, [project]);

  const handleCreateFlow = async () => {
    if (!authToken?.token) {
      return;
    }

    if (!prompt) {
      // toast.error("You must enter a prompt / description to begin");
      toast.error(t("You must enter a prompt / description to begin"));
      return;
    }

    setLoading(true);

    const flow = await createFlow(authToken?.token, prompt, null);

    router.push(`/project/${projectId}/flows/${flow.newFlow.id}/content`);
  };

  return (
    <React.Suspense fallback={<div>{t("Loading")}...</div>}>
      {/* Wrap with Suspense */}
      <ErrorBoundary>
        {/* Error Boundary */}
        <ClientOnly>
          <div className="flex flex-col justify-center items-center mx-auto w-[calc(100vw-100px)] md:w-full">
            {/* Alert explaining hub */}
            {hubAlertVisible && (
              <section className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-6 w-full md:w-[600px]">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">
                    {t("Welcome to the Hub")}!
                  </h2>

                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setHubAlertVisible(false)}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex items-center">
                  <Check className="mr-2" />
                  <span className="text-sm">
                    {t("Here you can generate content...")}
                  </span>
                </div>
              </section>
            )}

            <h1 className="text-3xl text-center mb-12">
              {t("Welcome to the Hub")}
            </h1>
            <FlowSteps step={1} />
            <div className="flex flex-col p-1 md:p-0 w-full">
              {/* <BrandKitList /> */}
              <div className="flex flex-col justify-center items-center mx-auto w-full md:w-[600px] rounded-[15px] shadow-[0_0_15px_4px_rgba(0,0,0,0.16)]">
                <textarea
                  ref={textareaRef}
                  className="w-full p-4 rounded-[15px] rounded-b-none placeholder-opacity-100 placeholder-gray-800"
                  rows={4}
                  // placeholder={`Enter a prompt / description. For example, "Let's create a video for Common's dog food campaign"`}
                  placeholder={
                    t("You must enter a prompt / description to begin") + "..."
                  }
                  onChange={(e) => setPrompt(e.target.value)}
                ></textarea>
                <button
                  className="w-full stunts-gradient rounded-[15px] rounded-t-none text-white p-2 px-4"
                  onClick={handleCreateFlow}
                  disabled={loading}
                >
                  {loading ? t("Working...") : t("Get Started")}
                </button>
              </div>
            </div>
          </div>
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}
