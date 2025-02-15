"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProjectItem } from "./items";
import {
  getProjects,
  ProjectData,
  ProjectInfo,
  ProjectsResponse,
} from "@/fetchers/projects";
import useSWR from "swr";

export const ProjectsList = () => {
  const router = useRouter();
  const authToken = localStorage.getItem("auth-token"); // Retrieve from localStorage

  let {
    data: projects,
    isLoading,
    error,
  } = useSWR("projects", () => getProjects(authToken));

  if (isLoading) {
    return <div>Loading projects...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!projects) {
    return <div>No projects found.</div>;
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <ProjectItem
          key={project.project_id}
          project_id={project.project_id}
          project_label={project.project_name}
          icon="folder-plus"
        />
      ))}
    </div>
  );
};
