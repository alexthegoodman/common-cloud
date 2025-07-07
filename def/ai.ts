import { z } from "zod";

export interface DataInterface {
  bulletPoints: {
    dataPoint: string;
    description: string;
  }[];
}

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

export interface QuestionInterface {
  questions: {
    question: string;
    possibleAnswers: {
      answerText: string;
    }[];
  }[];
}

export const questionSchema = z.object({
  questions: z.array(
    z.object({
      question: z
        .string()
        .describe("The qualitative or quantitative data point if one exists."),
      possibleAnswers: z.array(
        z.object({
          answerText: z
            .string()
            .describe(
              "The qualitative or quantitative data point if one exists."
            ),
        })
      ),
    })
  ),
});

export interface ContentInterface {
  contentItems: {
    summaryText: string;
  }[];
}

export const contentSchema = z.object({
  contentItems: z.array(
    z.object({
      summaryText: z
        .string()
        .describe("The qualitative or quantitative data point if one exists."),
    })
  ),
});

export interface AnimationInterface {
  animations: {
    objectId: string;
    properties: {
      propertyName: string;
      keyframes: {
        time: number;
        value: number | [number, number];
        easing: string;
      }[];
    }[];
    description: string;
  }[];
  duration: number;
  style: string;
}

export const animationSchema = z.object({
  duration: z.number().describe("Total animation duration in milliseconds"),
  style: z
    .string()
    .describe(
      "Animation style: 'smooth', 'bouncy', 'quick', 'dramatic', 'subtle'"
    ),
  animations: z.array(
    z.object({
      objectId: z
        .string()
        .describe(
          "The ID of the object to animate (e.g., 'text-1', 'polygon-2')"
        ),
      properties: z.array(
        z.object({
          propertyName: z
            .string()
            .describe(
              "The property to animate: 'Position', 'ScaleX', 'ScaleY', 'Rotation', 'Opacity'"
            ),
          keyframes: z.array(
            z.object({
              time: z
                .number()
                .describe("Time in milliseconds when this keyframe occurs"),
              value: z
                .union([z.number(), z.array(z.number()).length(2)])
                .describe(
                  "Value at this keyframe. Use [x, y] for position, single number for others. Scale/opacity: 0-100+"
                ),
              easing: z
                .string()
                .describe(
                  "Easing type: 'Linear', 'EaseIn', 'EaseOut', 'EaseInOut'"
                ),
            })
          ),
        })
      ),
      description: z
        .string()
        .describe("Brief description of what this animation does"),
    })
  ),
});
