"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { DataInterface, dataSchema, questionSchema } from "@/def/ai";
import { useLocalStorage } from "@uidotdev/usehooks";
import { AuthToken } from "@/fetchers/projects";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { getFlow, IFlowQuestions, updateFlowQuestions } from "@/fetchers/flows";

export default function FlowQuestions({
  flowId = null,
  projectId = null,
}: {
  flowId: string | null;
  projectId: string | null;
}) {
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  const [loading, setLoading] = useState(false);

  let {
    data: flow,
    isLoading,
    error,
  } = useSWR("flow" + flowId, () => getFlow(authToken, flowId as string));

  const [gotQuestions, setGotQuestions] = useState(false);
  const [answersProvided, setAnswersProvided] = useState<string[]>([]);

  const { object, submit } = useObject({
    api: "/api/flows/generate-questions",
    headers: {
      Authorization: `Bearer ${authToken?.token}`,
    },
    schema: questionSchema,
  });

  useEffect(() => {
    if (authToken && !gotQuestions && !isLoading && !error) {
      setGotQuestions(true);

      submit(flow?.flow.prompt);
    }
  }, [authToken, isLoading, error]);

  // Handle answer selection
  const handleAnswerSelection = (
    questionIndex: number,
    selectedAnswer: string
  ) => {
    setAnswersProvided((prev) => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = selectedAnswer;
      return newAnswers;
    });
  };

  const generateHandler = async () => {
    setLoading(true);

    if (!authToken) {
      return;
    }

    if (!object?.questions) {
      return;
    }

    const savableQuestions: IFlowQuestions = {
      questions: object.questions.map((question, i) => {
        return {
          possibleAnswers: question?.possibleAnswers?.map((possibleAnswer) => {
            return {
              answerText: possibleAnswer?.answerText!,
            };
          })!,
          question: question?.question!,
          chosenAnswer: answersProvided[i],
        };
      }),
    };

    await updateFlowQuestions(authToken?.token, flowId!, savableQuestions);

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {object && object.questions && (
        <div className="space-y-8">
          {object.questions.map((question, questionIndex) => {
            return (
              <div
                key={questionIndex}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {question?.question}
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {question?.possibleAnswers?.map(
                      (possibleAnswer, answerIndex) => {
                        const isSelected =
                          answersProvided[questionIndex] ===
                          possibleAnswer?.answerText;

                        return (
                          <button
                            key={answerIndex}
                            onClick={() => {
                              handleAnswerSelection(
                                questionIndex,
                                possibleAnswer?.answerText || ""
                              );
                            }}
                            className={`
                            p-3 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md
                            ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 text-blue-800 shadow-md"
                                : "border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 hover:bg-gray-100"
                            }
                          `}
                          >
                            <span className="block text-sm font-medium">
                              {possibleAnswer?.answerText}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center pt-6">
        <button
          className="stunts-gradient text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200 hover:shadow-lg"
          onClick={generateHandler}
          disabled={loading || !answersProvided.some((answer) => answer)}
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Saving and generating...</span>
            </span>
          ) : (
            "Generate Your Content!"
          )}
        </button>
      </div>
    </div>
  );
}
