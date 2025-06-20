import { ContentInterface, DataInterface } from "@/def/ai";
import { AuthToken, UploadResponse } from "./projects";

export interface FlowContent {}

export interface FlowQuestions {}

export interface FlowData {
  id: string;
  prompt: string;
  content: IFlowContent;
  questions: IFlowQuestions;
  updatedAt: string;
  createdAt: string;
}

export interface CreateFlowResponse {
  newFlow: FlowData;
}

export interface GetFlowResponse {
  flow: FlowData;
}

export const createFlow = async (
  token: string,
  prompt: string,
  brandKitId: string | null
): Promise<CreateFlowResponse> => {
  const emptyContent = {};
  const emptyQuestions = {};

  const response = await fetch("/api/flows/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt, brandKitId, emptyContent, emptyQuestions }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Create flow request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

export interface IFlowContent {
  files: UploadResponse[];
  links: DataInterface[];
}

export const updateFlowContent = async (
  token: string,
  flowId: string,
  content: IFlowContent
): Promise<CreateFlowResponse> => {
  const response = await fetch("/api/flows/update-content", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ flowId, content }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Update flow request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

export const updateFlowQuestions = async (
  token: string,
  flowId: string,
  questions: IFlowQuestions
): Promise<CreateFlowResponse> => {
  const response = await fetch("/api/flows/update-questions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ flowId, questions }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Update flow request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

export interface GenerateContentReponse {
  data: ContentInterface;
}

export const generateContent = async (
  token: string,
  userLanguage: string,
  prompt: string,
  links: DataInterface[],
  questions: IFlowQuestions
): Promise<GenerateContentReponse> => {
  const response = await fetch("/api/flows/generate-content", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-User-Language": `${userLanguage}`,
    },
    body: JSON.stringify({ prompt, links, questions }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Generate content request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

export const getFlow = async (
  authToken: AuthToken | null,
  flowId: string
): Promise<GetFlowResponse | null> => {
  if (!authToken) {
    return null;
  }

  const response = await fetch("/api/flows/get?flowId=" + flowId, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken.token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Get flow request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

export interface ScrapeLinkResponse {
  url: string;
  content: string;
  title: string;
  description: string;
}

export interface IFlowQuestions {
  questions: {
    question: string;
    possibleAnswers?: {
      answerText: string;
    }[];
    chosenAnswer: string;
  }[];
}

export const scrapeLink = async (
  token: string,
  url: string
): Promise<ScrapeLinkResponse> => {
  const emptyContent = {};
  const emptyQuestions = {};

  const response = await fetch("/api/flows/scrape-link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Scrape link request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};
