"use client";

export const FlowSteps = ({ step = 1 }: { step: number }) => {
  return (
    <div className="flex flex-row gap-4 mb-12">
      <div
        className={`flex flex-row gap-1 ${
          step === 1 ? "text-black" : "text-gray-400"
        }`}
      >
        <span>1.</span>
        <span className={step === 1 ? "underline underline-offset-8" : ""}>
          Your Prompt
        </span>
      </div>
      <div
        className={`flex flex-row gap-1 ${
          step === 2 ? "text-black" : "text-gray-400"
        }`}
      >
        <span>2.</span>
        <span className={step === 2 ? "underline underline-offset-8" : ""}>
          Your Content
        </span>
      </div>
      <div
        className={`flex flex-row gap-1 ${
          step === 3 ? "text-black" : "text-gray-400"
        }`}
      >
        <span>3.</span>
        <span className={step === 3 ? "underline underline-offset-8" : ""}>
          Intelligent Questions
        </span>
      </div>
    </div>
  );
};
