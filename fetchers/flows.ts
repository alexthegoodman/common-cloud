export interface FlowContent {}

export interface FlowQuestions {}

export interface FlowData {
  id: string;
  prompt: string;
  content: FlowContent;
  questions: FlowQuestions;
  updatedAt: string;
  createdAt: string;
}

export interface CreateFlowResponse {
  newFlow: FlowData;
}

export const createFlow = async (
  token: string,
  prompt: string,
  brandKitId: string | null
): Promise<CreateFlowResponse> => {
  const emptyContent = {};
  const emptyQuestions = {};

  const response = await fetch("http://localhost:3000/api/flows/create", {
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

export interface ScrapeLinkResponse {
  url: string;
  content: string;
  title: string;
  description: string;
}

export const scrapeLink = async (
  token: string,
  url: string
): Promise<ScrapeLinkResponse> => {
  const emptyContent = {};
  const emptyQuestions = {};

  const response = await fetch("http://localhost:3000/api/flows/scrape-link", {
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
