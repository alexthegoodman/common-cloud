"use client";

import { scrapeLink } from "@/fetchers/flows";
import { AuthToken } from "@/fetchers/projects";
import { Spinner } from "@phosphor-icons/react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { DataInterface, dataSchema } from "@/def/ai";
import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export const AnalyzeLink = ({
  authToken,
  links,
  setIsAnalyzing,
  index,
  isAnalyzing,
  link,
  handleLinkChange,
  setLinkData,
}: {
  authToken: AuthToken | null;
  links: string[];
  setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean[]>>;
  index: number;
  isAnalyzing: boolean[];
  link: string;
  handleLinkChange: (index: number, value: string) => void;
  setLinkData: Dispatch<SetStateAction<DataInterface[]>>;
}) => {
  const { t } = useTranslation("flow");

  const { object, submit } = useObject({
    api: "/api/flows/extract-data",
    headers: {
      Authorization: `Bearer ${authToken?.token}`,
    },
    schema: dataSchema,
    onFinish: ({ object, error }) => {
      // TODO: save analysis to flow
      console.info("save object", object);
      setLinkData((linkData) => {
        linkData[index] = object!;
        return linkData;
      });
    },
  });

  // Handle link analysis
  const analyzeLink = async (index: number) => {
    if (!authToken) {
      return;
    }

    if (!links[index].trim()) return;

    // Set the analyzing state for this link
    const newIsAnalyzing = [...isAnalyzing];
    newIsAnalyzing[index] = true;
    setIsAnalyzing(newIsAnalyzing);

    try {
      const linkData = await scrapeLink(authToken?.token, links[index]);

      // Handle successful analysis
      console.log(`Analyzed link ${index + 1}: ${links[index]}`, linkData);

      // Submit the data to the AI model
      submit(linkData.content);
    } catch (error) {
      console.error(`Error analyzing link ${index + 1}:`, error);
      toast.error(t("Error! Try a different URL"));
    } finally {
      // Reset the analyzing state
      const resetIsAnalyzing = [...isAnalyzing];
      resetIsAnalyzing[index] = false;
      setIsAnalyzing(resetIsAnalyzing);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div key={index} className="flex items-center space-x-2">
        <div className="flex-grow">
          <input
            type="url"
            placeholder={`Link ${index + 1}`}
            value={link}
            onChange={(e) => handleLinkChange(index, e.target.value)}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <button
          onClick={() => analyzeLink(index)}
          disabled={isAnalyzing[index] || !link.trim()}
          className={`p-3 rounded-md ${
            isAnalyzing[index] || !link.trim()
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {isAnalyzing[index] ? (
            <div className="flex items-center">
              <Spinner className="w-5 h-5 animate-spin mr-2" />
              {t("Analyzing")}...
            </div>
          ) : (
            t("Analyze")
          )}
        </button>
      </div>
      {object && object.bulletPoints && (
        <ul className="list-disc list-inside">
          {object.bulletPoints.map((point, i) => (
            <li key={i}>
              <strong>{point?.dataPoint}</strong> {point?.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
