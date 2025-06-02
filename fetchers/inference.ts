export const callMotionInference = async (
  //   token: string,
  //   fileName: string,
  prompt: string
): Promise<number[]> => {
  const response = await fetch(
    process.env.NODE_ENV === "production"
      ? "https://stunts-inf-api.madebycommon.com"
      : "http://localhost:8000",
    {
      method: "POST",
      headers: {
        // Remove Content-Type: application/json since we're sending raw binary data
        // Authorization: `Bearer ${token}`,
        // "X-File-Name": fileName,
        "X-Inference-Type": "motion",
      },
      body: prompt, // Send the prompt directly as the body
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Inference request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  let json = await response.json();

  return json;
};

export const callLayoutInference = async (
  //   token: string,
  //   fileName: string,
  prompt: string
): Promise<number[]> => {
  const response = await fetch(
    process.env.NODE_ENV === "production"
      ? "https://stunts-inf-api.madebycommon.com"
      : "http://localhost:8000",
    {
      method: "POST",
      headers: {
        // Remove Content-Type: application/json since we're sending raw binary data
        // Authorization: `Bearer ${token}`,
        // "X-File-Name": fileName,
        "X-Inference-Type": "layout",
      },
      body: prompt, // Send the prompt directly as the body
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Inference request failed: ${response.status} - ${response.statusText} - ${errorText}`
    );
  }

  let json = await response.json();

  return json;
};
