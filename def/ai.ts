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
