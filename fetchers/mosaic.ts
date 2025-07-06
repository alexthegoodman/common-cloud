import { DateTime } from "luxon";
import { ProjectInfo } from "./projects";
import { SavedState } from "@/engine/animations";

export interface ProjectsResponse {
  projects: ProjectData[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface ProjectData {
  id: string;
  name: string;
  fileData: SavedState;
  updatedAt: string;
  createdAt: string;
}

export interface PublicProjectInfo {
  project_id: string;
  project_name: string;
  video_data: SavedState;
  created: DateTime;
  modified: DateTime;
}

export const getPublicProjects = async (
  page: number = 1,
  limit: number = 6
): Promise<ProjectsResponse> => {
  const response = await fetch(
    `/api/projects/public?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${authToken.token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Projects request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  const projectsResponse: ProjectsResponse = await response.json();

  return projectsResponse;

  // const projects: PublicProjectInfo[] = projectsResponse.projects.map(
  //   (data) => ({
  //     project_id: data.id,
  //     project_name: data.name,
  //     video_data: data.fileData,
  //     created: DateTime.fromISO(data.createdAt), // Handle nulls and parse with DateTime
  //     modified: DateTime.fromISO(data.updatedAt),
  //   })
  // );

  // return projects.sort((a, b) => b.modified.diff(a.modified).milliseconds); // Sort using luxon's diff
};

export const getPublicFeaturedProjects = async (
  page: number = 1,
  limit: number = 6
): Promise<ProjectsResponse> => {
  const response = await fetch(
    `/api/projects/public-featured?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${authToken.token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Projects request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  const projectsResponse: ProjectsResponse = await response.json();

  return projectsResponse;

  // const projects: PublicProjectInfo[] = projectsResponse.projects.map(
  //   (data) => ({
  //     project_id: data.id,
  //     project_name: data.name,
  //     video_data: data.fileData,
  //     created: DateTime.fromISO(data.createdAt), // Handle nulls and parse with DateTime
  //     modified: DateTime.fromISO(data.updatedAt),
  //   })
  // );

  // return projects.sort((a, b) => b.modified.diff(a.modified).milliseconds); // Sort using luxon's diff
};

export interface SingleProjectResponse {
  project: ProjectData & {
    author: string;
  };
}

export const getPublicProject = async (
  projectId: string
): Promise<SingleProjectResponse> => {
  const response = await fetch(`/api/projects/public/${projectId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Project request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  const projectResponse: SingleProjectResponse = await response.json();

  return projectResponse;
};
