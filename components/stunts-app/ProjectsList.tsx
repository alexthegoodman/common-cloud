"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProjectItem } from "./items";
import {
  AuthToken,
  getProjects,
  ProjectData,
  ProjectInfo,
  ProjectsResponse,
} from "@/fetchers/projects";
import useSWR from "swr";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useTranslation } from "react-i18next";
import { getCurrentUser } from "@/hooks/useCurrentUser";

export const ProjectsList = () => {
  const { t } = useTranslation("common");

  const router = useRouter();
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  const { data: user } = useSWR("currentUser", () =>
    getCurrentUser(authToken?.token ? authToken?.token : "")
  );

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
          user={user}
        />
      ))}
    </div>
  );
};
