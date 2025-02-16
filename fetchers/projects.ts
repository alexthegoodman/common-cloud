import {
  SavedState,
  SavedTimelineStateConfig,
  Sequence,
} from "@/engine/animations";
import { DateTime } from "luxon";

export interface AuthToken {
  token: string;
  expiry: number;
}

export interface SingleProjectResponse {
  project: {
    id: string;
    name: string;
    fileData: SavedState;
    updatedAt: DateTime;
    createdAt: DateTime;
  } | null;
}

export interface ProjectsResponse {
  projects: ProjectData[];
}

export interface ProjectInfo {
  project_id: string;
  project_name: string;
  created: DateTime;
  modified: DateTime;
}

export interface CreateProjectRequest {
  name: string;
  empty_file_data: SavedState;
}

export interface ProjectData {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
}

export interface CreateProjectResponse {
  newProject: ProjectData;
}

export interface UpdateSequencesResponse {
  updatedProject: ProjectData;
}
export interface UpdateTimelineResponse {
  updatedProject: ProjectData;
}
export interface UploadResponse {
  url: String;
  fileName: String;
  size: number;
  mimeType: String;
}

export const getSingleProject = async (
  authToken: AuthToken | null,
  project_id: string
): Promise<SingleProjectResponse> => {
  if (!authToken) {
    return {
      project: null,
    };
  }

  const url = new URL("http://localhost:3000/api/projects/single");
  url.searchParams.set("projectId", project_id);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken.token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text(); // Get error details from server
    throw new Error(
      `Project request failed: ${response.status} - ${response.statusText} - ${errorText}`
    ); // Throw error with details
  }

  return response.json();
};

export const getProjects = async (
  authToken: AuthToken | null
): Promise<ProjectInfo[]> => {
  if (!authToken) {
    return [];
  }

  const response = await fetch("http://localhost:3000/api/projects/all", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken.token}`,
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
    created: DateTime.fromISO(data.createdAt), // Handle nulls and parse with DateTime
    modified: DateTime.fromISO(data.updatedAt),
  }));

  return projects.sort((a, b) => b.modified.diff(a.modified).milliseconds); // Sort using luxon's diff
};

export const createProject = async (
  token: string,
  name: string,
  emptyFileData: any
): Promise<CreateProjectResponse> => {
  const response = await fetch("http://localhost:3000/api/projects/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, emptyFileData }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Create project request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

// export const saveSequencesData
// = async (
//   token: string,
//   name: string,
//   emptyFileData: any
// ): Promise<CreateProjectResponse> => {
//   const response = await fetch("http://localhost:3000/api/projects/create", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify({ name, emptyFileData }),
//   });

//   if (!response.ok) {
//     const errorText = await response.text();
//     throw new Error(
//       `Create project request failed: ${response.status} - ${response.statusText} - ${errorText}`
//     );
//   }

//   return response.json();
// };

export const updateSequences = async (
  token: string,
  projectId: string,
  sequences: Sequence[]
): Promise<UpdateSequencesResponse> => {
  const response = await fetch(
    "http://localhost:3000/api/projects/update-sequences",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ projectId, sequences }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Update sequences request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

export const updateTimeline = async (
  token: string,
  projectId: string,
  timelineState: SavedTimelineStateConfig
): Promise<UpdateTimelineResponse> => {
  const response = await fetch(
    "http://localhost:3000/api/projects/update-timeline",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ projectId, timelineState }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Create project request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

export const saveImage = async (
  token: string,
  fileName: string,
  data: Blob
): Promise<UploadResponse> => {
  const response = await fetch("http://localhost:3000/api/upload/image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    // data
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Save image request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};
