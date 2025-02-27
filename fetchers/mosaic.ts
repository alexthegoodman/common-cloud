import { DateTime } from "luxon";
import { ProjectInfo } from "./projects";
import { SavedState } from "@/engine/animations";

export interface ProjectsResponse {
  projects: ProjectData[];
}

export interface ProjectData {
  id: string;
  name: string;
  fileData: SavedState;
  updatedAt: string;
  createdAt: string;
}

export const getPublicProjects = async (): Promise<ProjectInfo[]> => {
  const response = await fetch("http://localhost:3000/api/projects/public", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${authToken.token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Projects request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  const projectsResponse: ProjectsResponse = await response.json();

  const projects: ProjectInfo[] = projectsResponse.projects.map((data) => ({
    project_id: data.id,
    project_name: data.name,
    video_data: data.fileData,
    created: DateTime.fromISO(data.createdAt), // Handle nulls and parse with DateTime
    modified: DateTime.fromISO(data.updatedAt),
  }));

  return projects.sort((a, b) => b.modified.diff(a.modified).milliseconds); // Sort using luxon's diff
};
