import { z } from "zod";

export interface DataInterface {
  bulletPoints: {
    dataPoint: string;
    description: string;
  }[];
}

// define a schema for the notifications
export const dataSchema = z.object({
  bulletPoints: z.array(
    z.object({
      dataPoint: z
        .string()
        .describe("The qualitative or quantitative data point if one exists."),
      description: z
        .string()
        .describe("The text summarizing this bullet point."),
    })
  ),
});
