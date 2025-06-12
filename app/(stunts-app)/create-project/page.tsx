"use client";

import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/stunts-app/ErrorBoundary";
import { SavedState } from "@/engine/animations";
import { AuthToken, createProject } from "@/fetchers/projects";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const ProjectForm = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<any>(); // Type the form data
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  const onSubmit = async (data: { project_name: string }) => {
    if (!authToken) {
      return;
    }

    // Type the form data
    try {
      const videoState: SavedState = {
        sequences: [],
        timeline_state: {
          timeline_sequences: [],
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

      router.push(`/project/${projectId}/videos`);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create a new project
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="project_name" className="sr-only">
                Project name
              </label>
              <input
                id="project_name"
                type="text"
                {...register("project_name", {
                  required: "Project name is required",
                })} // react-hook-form integration
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border
                  border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none 
                  focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm
                  ${errors.project_name ? "border-red-500" : ""}`} // Conditional styling for errors
                placeholder="Project name"
              />
              {errors.project_name && (
                <p className="text-red-500 text-sm">
                  {errors.project_name.message?.toString()}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent
                text-sm font-medium rounded-md text-white stunts-gradient 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting} // Disable while submitting
            >
              {isSubmitting ? "Creating Project..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function CreateProject() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
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
