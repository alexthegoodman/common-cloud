export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  stripePriceId: string;
  stripeDevPriceId: string;
  features: string[];
}

export interface PlansResponse {
  plans: Plan[];
}

export const getPlans = async (): Promise<PlansResponse> => {
  const response = await fetch("/api/plans/all", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      //   Authorization: `Bearer ${authToken.token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Plans request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  const projectsResponse: PlansResponse = await response.json();

  //   const projects: ProjectInfo[] = projectsResponse.projects.map((data) => ({
  //     project_id: data.id,
  //     project_name: data.name,
  //     created: DateTime.fromISO(data.createdAt), // Handle nulls and parse with DateTime
  //     modified: DateTime.fromISO(data.updatedAt),
  //   }));

  //   return projects.sort((a, b) => b.modified.diff(a.modified).milliseconds); // Sort using luxon's diff

  return projectsResponse;
};
