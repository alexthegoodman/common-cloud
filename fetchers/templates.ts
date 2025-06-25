import { AuthToken } from "./projects";

export interface Template {
  id: string;
  name: string;
  fileData: any;
  createdAt: string;
  updatedAt: string;
}

export async function getTemplates(): Promise<Template[]> {
  try {
    const response = await fetch("/api/projects/templates", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch templates");
    }

    const data = await response.json();
    return data.templates || [];
  } catch (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
}

export function selectRandomTemplate(templates: Template[]): Template | null {
  if (templates.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}