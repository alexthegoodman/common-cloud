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
import { useLocalStorage } from "@uidotdev/usehooks";
import { useTranslation } from "react-i18next";

export const ProjectsList = () => {
  const { t } = useTranslation("common");

  const router = useRouter();
  const [authToken] = useLocalStorage("auth-token", null);

  let {
    data: projects,
    isLoading,
    error,
  } = useSWR("projects", () => getProjects(authToken));

  if (isLoading) {
    return <div>{t("Loading projects")}...</div>;
  }

  if (error) {
    return <div>{t("Error")}</div>;
  }

  if (!projects) {
    return <div>{t("No projects found")}.</div>;
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
