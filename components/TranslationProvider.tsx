"use client";
import { I18nextProvider } from "react-i18next";
import { createInstance, i18n } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";
import { useEffect, useState } from "react";

export default function TranslationProvider({
  children = null,
  language = "en",
}) {
  const [i18nInstance, setI18nInstance] = useState<i18n | null>(null);

  useEffect(() => {
    const initI18n = async () => {
      const instance = createInstance();
      await instance
        .use(initReactI18next)
        .use(
          resourcesToBackend(
            (lng: string, ns: string) => import(`../locales/${lng}/${ns}.json`)
          )
        )
        .init({
          lng: language,
          fallbackLng: "en",
          supportedLngs: ["en", "hi", "hit"],
          defaultNS: "common",
          interpolation: { escapeValue: false },
        });

      setI18nInstance(instance);
    };

    initI18n();
  }, [language]);

  if (!i18nInstance) return children;

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}
