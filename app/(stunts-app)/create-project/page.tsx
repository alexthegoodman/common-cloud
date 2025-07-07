"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import { SavedState, Sequence, TrackType } from "@/engine/animations";
import { AuthToken, createProject } from "@/fetchers/projects";
import { useLocalStorage } from "@uidotdev/usehooks";
import { t } from "i18next";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";

const ProjectForm = () => {
  const { t } = useTranslation("common");

  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<any>(); // Type the form data
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  const onSubmit = async (data: { project_name: string }) => {
    if (!authToken) {
      return;
    }

    // Type the form data
    try {
      let newId = uuidv4().toString();

      const defaultVideoSequence: Sequence = {
        id: newId,
        name: "Sequence #1",
        backgroundFill: { type: "Color", value: [200, 200, 200, 255] },
        durationMs: 20000,
        activePolygons: [],
        polygonMotionPaths: [],
        activeTextItems: [],
        activeImageItems: [],
        activeVideoItems: [],
      };

      const videoState: SavedState = {
        sequences: [defaultVideoSequence],
        timeline_state: {
          timeline_sequences: [
            {
              id: uuidv4(),
              sequenceId: newId,
              trackType: TrackType.Video,
              startTimeMs: 0,
              // duration_ms: 20000,
            },
          ],
        },
      };

      const docState: SavedState = {
        sequences: [],
        timeline_state: null,
      };

      const presState: SavedState = {
        sequences: [],
        timeline_state: null,
      };

      if (!authToken?.token) {
        throw new Error("No auth token available");
      }

      const info = await createProject(
        authToken.token,
        data.project_name,
        videoState,
        docState,
        presState
      );
      // router.push("/projects");
      // go directly to project videos page
      const projectId = info.newProject.id;
      localStorage.setItem(
        "stored-project",
        JSON.stringify({ project_id: projectId })
      );

      router.push(`/project/${projectId}/choose-path`);
    } catch (error) {
      console.error("Error creating project:", error);
      if (error instanceof Error && error.message.includes("Project limit reached")) {
        setError("root", { 
          type: "manual", 
          message: "Project limit reached. Upgrade to create more projects." 
        });
      } else {
        setError("root", { 
          type: "manual", 
          message: "Failed to create project. Please try again." 
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t("Create a new project")}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="project_name" className="sr-only">
                {t("Project name")}
              </label>
              <input
                id="project_name"
                type="text"
                {...register("project_name", {
                  required: t("Project name is required"),
                })} // react-hook-form integration
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border
                  border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none 
                  focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm
                  ${errors.project_name ? "border-red-500" : ""}`} // Conditional styling for errors
                placeholder={t("Project name")}
              />
              {errors.project_name && (
                <p className="text-red-500 text-sm">
                  {errors.project_name.message?.toString()}
                </p>
              )}
            </div>
          </div>

          {errors.root && (
            <div className="text-red-500 text-sm text-center">
              {errors.root.message?.toString()}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent
                text-sm font-medium rounded-md text-white stunts-gradient 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting} // Disable while submitting
            >
              {isSubmitting
                ? t("Creating Project") + "..."
                : t("Create Project")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function CreateProject() {
  return (
    <React.Suspense fallback={<div>{t("Loading")}...</div>}>
      {/* Wrap with Suspense */}
      <ErrorBoundary>
        {/* Error Boundary */}
        <ClientOnly>
          <div className="container mx-auto py-4">
            <ProjectForm />
          </div>
        </ClientOnly>
      </ErrorBoundary>
    </React.Suspense>
  );
}
