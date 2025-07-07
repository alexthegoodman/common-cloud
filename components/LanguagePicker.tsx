// "use client";

// import { AuthToken } from "@/fetchers/projects";
// import { updateUserLanguage } from "@/fetchers/users";
// import { useLocalStorage } from "@uidotdev/usehooks";
// import * as React from "react";

// const LanguagePicker = ({
//   ref = null,
//   className = "",
//   onClick = (e: any) => console.info("Click LanguagePicker"),
// }) => {
//   const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

//   const supportedLanguages = [
//     { lng: "en", labelEn: "English", labelNative: "English", color: "#A4036F" },
//     { lng: "hi", labelEn: "Hindi", labelNative: "हिंदी", color: "#048BA8" },
//   ];

//   const selectLanguage = async (lng: string) => {
//     if (!authToken) {
//       return;
//     }

//     await updateUserLanguage(authToken.token, lng);

//     location.reload();
//   };

//   return (
//     <section className="languageGrid">
//       <span>Select your language</span>
//       <div className="languageGridInner">
//         {supportedLanguages.map((language, i) => {
//           return (
//             <a
//               key={`languageItem${i}`}
//               className="item"
//               style={{ backgroundColor: language.color }}
//               href="#!"
//               onClick={() => selectLanguage(language.lng)}
//             >
//               <span className="labelNative">{language.labelNative}</span>
//               <span className="labelEn">{language.labelEn}</span>
//             </a>
//           );
//         })}
//       </div>
//     </section>
//   );
// };

// export default LanguagePicker;

"use client";

import { AuthToken } from "@/fetchers/projects";
import { updateUserLanguage } from "@/fetchers/users";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useRouter } from "next/navigation";
import * as React from "react";

const LanguagePicker = ({
  ref = null,
  className = "",
  onClick = (e: any) => console.info("Click LanguagePicker"),
}) => {
  const router = useRouter();
  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);
  const [selectedLang, setSelectedLang] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const supportedLanguages = [
    {
      lng: "hit",
      labelEn: "Hindi (Roman)",
      labelNative: "Hindi (Roman)",
      color: "#F18F01",
      flag: "🇮🇳",
      description: "Hindi Roman mein",
    },
    {
      lng: "en",
      labelEn: "English",
      labelNative: "English",
      color: "#A4036F",
      flag: "🇺🇸",
      description: "International language",
    },
    {
      lng: "hi",
      labelEn: "Hindi",
      labelNative: "हिंदी",
      color: "#048BA8",
      flag: "🇮🇳",
      description: "भारतीय भाषा",
    },
  ];

  const selectLanguage = async (lng: string) => {
    if (!authToken || isLoading) {
      return;
    }

    setIsLoading(true);
    setSelectedLang(lng);

    try {
      await updateUserLanguage(authToken.token, lng);
      // Add a small delay for better UX feedback
      setTimeout(() => {
        // location.reload();
        // router.push("/onboarding-carousel");
        window.location.href =
          process.env.NODE_ENV === "production"
            ? "https://madebycommon.com/onboarding-carousel"
            : "http://localhost:3000/onboarding-carousel";
      }, 400);
    } catch (error) {
      setIsLoading(false);
      setSelectedLang(null);
      console.error("Failed to update language:", error);
    }
  };

  return (
    <section className={`max-w-md mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-4">
          <span className="text-2xl">🌐</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Choose Your Language
        </h2>
        <p className="text-gray-600 text-sm">
          Select your preferred language to continue
        </p>
      </div>

      {/* Language Options */}
      <div className="space-y-3">
        {supportedLanguages.map((language, i) => {
          const isSelected = selectedLang === language.lng;
          const isCurrentlyLoading = isLoading && isSelected;

          return (
            <button
              key={`languageItem${i}`}
              className={`
                relative w-full p-4 rounded-xl border-2 transition-all duration-300 
                group hover:scale-[1.02] hover:shadow-lg
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }
                ${isCurrentlyLoading ? "cursor-not-allowed" : "cursor-pointer"}
                focus:outline-none focus:ring-4 focus:ring-blue-200
              `}
              onClick={() => selectLanguage(language.lng)}
              disabled={isLoading}
              aria-pressed={isSelected}
              aria-describedby={`lang-desc-${i}`}
            >
              {/* Loading Overlay */}
              {isCurrentlyLoading && (
                <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-blue-600 font-medium">
                      Updating...
                    </span>
                  </div>
                </div>
              )}

              {/* Add hidden description for screen readers */}
              <span id={`lang-desc-${i}`} className="sr-only">
                Select {language.labelNative} as your preferred language. {language.description}
              </span>
              
              {/* Language Card Content */}
              <div className="flex items-center space-x-4">
                {/* Flag and Color Indicator */}
                <div className="flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm"
                    style={{ backgroundColor: language.color }}
                  >
                    <span className="filter drop-shadow-sm">
                      {language.flag}
                    </span>
                  </div>
                </div>

                {/* Language Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {language.labelNative}
                    </h3>
                    {isSelected && !isCurrentlyLoading && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {language.labelEn} • {language.description}
                  </p>
                </div>

                {/* Arrow Indicator */}
                <div
                  className={`
                  flex-shrink-0 transform transition-transform duration-200
                  ${
                    isSelected
                      ? "translate-x-0"
                      : "translate-x-0 group-hover:translate-x-1"
                  }
                `}
                >
                  <svg
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isSelected
                        ? "text-blue-500"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Your language preference will be saved and applied immediately
        </p>
      </div>
    </section>
  );
};

export default LanguagePicker;
