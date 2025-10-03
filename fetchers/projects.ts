import {
  ProjectSettings,
  SavedState,
  SavedTimelineStateConfig,
  Sequence,
} from "../engine/animations";
import { DocState } from "../engine/data";
import { SaveTarget } from "../engine/editor_state";
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
    docData: SavedState;
    presData: SavedState;
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
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export const getSingleProject = async (
  authToken: string | null,
  project_id: string
): Promise<SingleProjectResponse> => {
  // if (!authToken) {
  //   return {
  //     project: null,
  //   };
  // }

  const url = new URL(
    process.env.NODE_ENV === "production"
      ? "https://madebycommon.com/api/projects/single"
      : "http://localhost:3000/api/projects/single"
  );
  url.searchParams.set("projectId", project_id);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
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

  const response = await fetch("/api/projects/all", {
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
  emptyVideoData: SavedState,
  emptyDocData: SavedState,
  emptyPresData: SavedState
): Promise<CreateProjectResponse> => {
  const response = await fetch("/api/projects/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, emptyVideoData, emptyDocData, emptyPresData }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(async () => ({
      error: await response.text(),
    }));
    throw new Error(
      errorData.error ||
        `Create project request failed: ${response.status} - ${response.statusText}`
    );
  }

  return response.json();
};

export async function saveSequencesData(
  sequences: Sequence[],
  saveTarget: SaveTarget
): Promise<UpdateSequencesResponse | null> {
  if (process.env.NODE_ENV === "test") {
    return null;
  }

  try {
    // Get stored-project and auth-token from local storage
    const storedProjectString = localStorage.getItem("stored-project");
    const authTokenString = localStorage.getItem("auth-token");

    if (!storedProjectString || !authTokenString) {
      throw new Error(
        "Couldn't get stored project or auth token from local storage"
      );
    }

    const storedProject = JSON.parse(storedProjectString);
    const authToken: AuthToken = JSON.parse(authTokenString);

    // Call the updateSequences function
    return await updateSequences(
      authToken.token,
      storedProject.project_id,
      sequences,
      saveTarget
    );
  } catch (error) {
    console.error("Error saving sequences data:", error);
    // Handle the error appropriately, e.g., return a default response or throw the error
    throw error; // Re-throw if you want the calling function to handle it
    // Or return a default/error response:
    // return { success: false, message: error.message }; // Example
  }
}

export const updateSequences = async (
  token: string,
  projectId: string,
  sequences: Sequence[],
  saveTarget: SaveTarget
): Promise<UpdateSequencesResponse> => {
  const response = await fetch("/api/projects/update-sequences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId, saveTarget, sequences }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Update sequences request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

export async function saveSettingsData(
  settings: ProjectSettings,
  saveTarget: SaveTarget
): Promise<UpdateSequencesResponse | null> {
  if (process.env.NODE_ENV === "test") {
    return null;
  }

  try {
    // Get stored-project and auth-token from local storage
    const storedProjectString = localStorage.getItem("stored-project");
    const authTokenString = localStorage.getItem("auth-token");

    if (!storedProjectString || !authTokenString) {
      throw new Error(
        "Couldn't get stored project or auth token from local storage"
      );
    }

    const storedProject = JSON.parse(storedProjectString);
    const authToken: AuthToken = JSON.parse(authTokenString);

    // Call the updateSequences function
    return await updateSettings(
      authToken.token,
      storedProject.project_id,
      settings,
      saveTarget
    );
  } catch (error) {
    console.error("Error saving settings data:", error);
    // Handle the error appropriately, e.g., return a default response or throw the error
    throw error; // Re-throw if you want the calling function to handle it
    // Or return a default/error response:
    // return { success: false, message: error.message }; // Example
  }
}

export const updateSettings = async (
  token: string,
  projectId: string,
  settings: ProjectSettings,
  saveTarget: SaveTarget
): Promise<UpdateSequencesResponse> => {
  const response = await fetch("/api/projects/update-settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId, saveTarget, settings }),
  });

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
  const response = await fetch("/api/projects/update-timeline", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId, timelineState }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Create project request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

export async function saveTimelineData(
  timelineState: SavedTimelineStateConfig
): Promise<UpdateSequencesResponse | null> {
  if (process.env.NODE_ENV === "test") {
    return null;
  }

  try {
    // Get stored-project and auth-token from local storage
    const storedProjectString = localStorage.getItem("stored-project");
    const authTokenString = localStorage.getItem("auth-token");

    if (!storedProjectString || !authTokenString) {
      throw new Error(
        "Couldn't get stored project or auth token from local storage"
      );
    }

    const storedProject = JSON.parse(storedProjectString);
    const authToken: AuthToken = JSON.parse(authTokenString);

    // Call the updateSequences function
    return await updateTimeline(
      authToken.token,
      storedProject.project_id,
      timelineState
    );
  } catch (error) {
    console.error("Error saving timeline data:", error);
    // Handle the error appropriately, e.g., return a default response or throw the error
    throw error; // Re-throw if you want the calling function to handle it
    // Or return a default/error response:
    // return { success: false, message: error.message }; // Example
  }
}

export const saveImage = async (
  token: string,
  fileName: string,
  data: Blob
): Promise<UploadResponse> => {
  const response = await fetch("/api/upload/image", {
    method: "POST",
    headers: {
      // Remove Content-Type: application/json since we're sending raw binary data
      Authorization: `Bearer ${token}`,
      "X-File-Name": fileName,
    },
    body: data, // Send the Blob directly as the body
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Save image request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

export const getUploadedImage = async (
  token: string,
  filename: string
): Promise<Blob> => {
  const response = await fetch(
    // `http://localhost:3000/api/media/image?filename=${encodeURIComponent(
    //   filename
    // )}`,
    // for now or forever, just fetch directly from url
    `${filename}`,
    {
      method: "GET",
      // headers: {
      //   Authorization: `Bearer ${token}`,
      // },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Get image request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  // let blob = await response.blob();

  // console.info("blob details", blob.size);

  // return blob;

  const arrayBuffer = await response.arrayBuffer();

  // Create a properly typed Blob specifically for image data
  return new Blob([arrayBuffer], {
    type: response.headers.get("Content-Type") || "image/jpeg",
  });
};

export async function getUploadedImageData(
  filename: string
): Promise<Blob | null> {
  if (process.env.NODE_ENV === "test") {
    return null;
  }

  try {
    // Get stored-project and auth-token from local storage
    // const storedProjectString = localStorage.getItem("stored-project");
    const authTokenString = localStorage.getItem("auth-token");

    if (!authTokenString) {
      throw new Error("Couldn't get auth token from local storage");
    }

    // const storedProject = JSON.parse(storedProjectString);
    const authToken: AuthToken = JSON.parse(authTokenString);

    // Call the updateSequences function
    return await getUploadedImage(authToken.token, filename);
  } catch (error) {
    console.error("Error getting image data:", error);
    // Handle the error appropriately, e.g., return a default response or throw the error
    throw error; // Re-throw if you want the calling function to handle it
    // Or return a default/error response:
    // return { success: false, message: error.message }; // Example
  }
}

export const saveVideo = async (
  token: string,
  fileName: string,
  data: Blob
): Promise<UploadResponse> => {
  const response = await fetch("/api/upload/video", {
    method: "POST",
    headers: {
      // Remove Content-Type: application/json since we're sending raw binary data
      Authorization: `Bearer ${token}`,
      "X-File-Name": fileName,
    },
    body: data, // Send the Blob directly as the body
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Save video request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

export const getUploadedVideo = async (
  token: string,
  filename: string
): Promise<Blob> => {
  const response = await fetch(
    // `http://localhost:3000/api/media/image?filename=${encodeURIComponent(
    //   filename
    // )}`,
    // for now or forever, just fetch directly from url
    `${filename}`,
    {
      method: "GET",
      // headers: {
      //   Authorization: `Bearer ${token}`,
      // },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Get video request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  let blob = await response.blob();

  console.info("blob details", blob.size);

  return blob;

  // const arrayBuffer = await response.arrayBuffer();

  // // Create a properly typed Blob specifically for image data
  // return new Blob([arrayBuffer], {
  //   type: response.headers.get("Content-Type") || "image/jpeg",
  // });
};

export async function getUploadedVideoData(
  filename: string
): Promise<Blob | null> {
  if (process.env.NODE_ENV === "test") {
    return null;
  }

  try {
    // Get stored-project and auth-token from local storage
    // const storedProjectString = localStorage.getItem("stored-project");
    const authTokenString = localStorage.getItem("auth-token");

    if (!authTokenString) {
      throw new Error("Couldn't get auth token from local storage");
    }

    // const storedProject = JSON.parse(storedProjectString);
    const authToken: AuthToken = JSON.parse(authTokenString);

    // Call the updateSequences function
    return await getUploadedVideo(authToken.token, filename);
  } catch (error) {
    console.error("Error getting video data:", error);
    // Handle the error appropriately, e.g., return a default response or throw the error
    throw error; // Re-throw if you want the calling function to handle it
    // Or return a default/error response:
    // return { success: false, message: error.message }; // Example
  }
}

export const deleteProject = async (
  token: string,
  projectId: string
): Promise<{ message: string }> => {
  const response = await fetch("/api/projects/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Delete project request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

export const createDemoProject = async (
  token: string
): Promise<CreateProjectResponse> => {
  const response = await fetch("/api/projects/create-demo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(async () => ({
      error: await response.text(),
    }));
    throw new Error(
      errorData.error ||
        `Create demo project request failed: ${response.status} - ${response.statusText}`
    );
  }

  return response.json();
};

export const resizeVideo = async (
  videoFile: File | Blob,
  maxWidth = 1200,
  maxHeight = 900
) => {
  // const response = await fetch(
  //   "https://stunts-inf-api.madebycommon.com/resize-video",
  //   {
  //     method: "POST",
  //     headers: {
  //       "X-Max-Width": maxWidth.toString(),
  //       "X-Max-Height": maxHeight.toString(),
  //     },
  //     body: videoFile,
  //   }
  // );

  const formData = new FormData();
  formData.append("video", videoFile);
  formData.append("maxWidth", maxWidth.toString());
  formData.append("maxHeight", maxHeight.toString());

  const response = await fetch("http://localhost:3002/resize-video", {
    method: "POST",
    body: formData,
  });

  if (response.ok) {
    return await response.blob();
  } else {
    const error = await response.json();
    throw new Error(error.details);
  }
};
