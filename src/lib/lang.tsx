"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { t, type Lang, type TKey } from "./i18n";

const LANG_KEY = "upos_lang";

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
  isUrdu: boolean;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY) as Lang | null;
    if (saved === "ur" || saved === "en") {
      setLangState(saved);
      applyLangToDocument(saved);
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
    applyLangToDocument(l);
  }, []);

  const translate = useCallback((key: TKey) => t(key, lang), [lang]);

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, t: translate, isUrdu: lang === "ur" }),
    [lang, setLang, translate],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

function applyLangToDocument(lang: Lang) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (lang === "ur") {
    html.setAttribute("dir", "rtl");
    html.setAttribute("lang", "ur");
    // Load Noto Nastaliq Urdu font if not already loaded
    if (!document.getElementById("urdu-font")) {
      const link = document.createElement("link");
      link.id = "urdu-font";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap";
      document.head.appendChild(link);
    }
    document.body.style.fontFamily = "'Noto Nastaliq Urdu', serif";
  } else {
    html.setAttribute("dir", "ltr");
    html.setAttribute("lang", "en");
    document.body.style.fontFamily = "";
  }
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
