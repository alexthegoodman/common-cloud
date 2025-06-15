"use client";

// import { useTranslation } from "next-i18next";

import { AuthToken } from "@/fetchers/projects";
import { updateUserLanguage } from "@/fetchers/users";
import { useLocalStorage } from "@uidotdev/usehooks";
import * as React from "react";
// import { useCookies } from "react-cookie";

const LanguagePicker = ({
  ref = null,
  className = "",
  onClick = (e: any) => console.info("Click LanguagePicker"),
}) => {
  //   const { t } = useTranslation();
  //   const [cookies, setCookie] = useCookies(["coUserToken", "coUserLng"]);
  //   const token = cookies.coUserToken;

  //   const gqlClient = graphClient.setupClient(token);

  const [authToken] = useLocalStorage<AuthToken | null>("auth-token", null);

  const supportedLanguages = [
    { lng: "en", labelEn: "English", labelNative: "English", color: "#A4036F" },
    { lng: "hi", labelEn: "Hindi", labelNative: "हिंदी", color: "#048BA8" },
  ];

  const selectLanguage = async (lng: string) => {
    if (!authToken) {
      return;
    }

    // await graphClient.client.request(updateUserLanguageMutation, {
    //   language: lng,
    // });

    // setCookie("coUserLng", lng);

    await updateUserLanguage(authToken.token, lng);

    location.reload();
  };

  return (
    <section className="languageGrid">
      <span>Select your language</span>
      <div className="languageGridInner">
        {supportedLanguages.map((language, i) => {
          return (
            <a
              key={`languageItem${i}`}
              className="item"
              style={{ backgroundColor: language.color }}
              href="#!"
              onClick={() => selectLanguage(language.lng)}
            >
              <span className="labelNative">{language.labelNative}</span>
              <span className="labelEn">{language.labelEn}</span>
            </a>
          );
        })}
      </div>
    </section>
  );
};

export default LanguagePicker;
