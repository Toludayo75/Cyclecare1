import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTranslation, LangCode } from "@/constants/translations";

const LANG_KEY = "cyclecare_language";

interface LanguageContextValue {
  language: LangCode;
  setLanguage: (code: LangCode) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: async () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((val) => {
      if (val === "en" || val === "yo" || val === "ig" || val === "ha") {
        setLangState(val);
      }
    });
  }, []);

  async function setLanguage(code: LangCode) {
    setLangState(code);
    await AsyncStorage.setItem(LANG_KEY, code);
  }

  function t(key: string, params?: Record<string, string | number>): string {
    return getTranslation(language, key, params);
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
