import { CurrentUser } from "@/hooks/useCurrentUser";

export interface UpdateLanguageResponse {
  updatedUser: CurrentUser;
}

export const updateUserLanguage = async (
  token: string,
  chosenLanguage: string
): Promise<UpdateLanguageResponse> => {
  const response = await fetch("/api/users/update-language", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ chosenLanguage }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Update language request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};
