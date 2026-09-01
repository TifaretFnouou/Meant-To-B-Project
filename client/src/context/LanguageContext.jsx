import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translate } from "../i18n/translations";

const LanguageContext = createContext(null);
const STORAGE_KEY = "queenb_lang";

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "he";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "he" ? "en" : "he"));
  };

  const t = (key, params) => translate(language, key, params);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      isRtl: language === "he",
      t,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
