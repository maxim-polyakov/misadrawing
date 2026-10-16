import { useEffect, useState } from "react";
import languagePack from "./galleryLanguagePack.json";
import galleryLabels from "./galleryLabels.json";

const STORAGE_KEY = "misa_gallery_locale";

export const LANGUAGES = languagePack.languages;
export const LANGUAGE_CODES = LANGUAGES.map(({ code }) => code);
const messages = languagePack.translations;
const previewMessages = languagePack.previews;

const isSupported = (code) => LANGUAGE_CODES.includes(code);

export function getLanguage() {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (isSupported(fromUrl)) {
        localStorage.setItem(STORAGE_KEY, fromUrl);
        return fromUrl;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSupported(stored)) return stored;

    const browser = navigator.language || "en";
    if (isSupported(browser)) return browser;
    const short = browser.split("-")[0];
    return isSupported(short) ? short : "en";
}

export function withLangQuery(target, language = getLanguage()) {
    const url = new URL(target, window.location.origin);
    url.searchParams.set("lang", language);
    return `${url.pathname}${url.search}${url.hash}`;
}

export function setLanguage(language) {
    if (!isSupported(language)) return;
    localStorage.setItem(STORAGE_KEY, language);
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(language)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    const next = withLangQuery(`${window.location.pathname}${window.location.search}${window.location.hash}`, language);
    window.history.replaceState(window.history.state, "", next);
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
    document.documentElement.dir = ["ar", "he", "fa", "ur", "yi"].includes(language) ? "rtl" : "ltr";
    const preview = previewMessages[language] || previewMessages.en;
    document.title = preview.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", preview.description);
    window.dispatchEvent(new CustomEvent("gallerylocalechange", { detail: language }));
}

export function translate(language, key) {
    if (key === "gallery") {
        return galleryLabels[language] || galleryLabels.en;
    }

    return (messages[language] || messages.en)[key] || messages.en[key] || key;
}

export function useLanguage() {
    const [language, updateLanguage] = useState(getLanguage);

    useEffect(() => {
        const onChange = (event) => updateLanguage(event.detail || getLanguage());
        window.addEventListener("gallerylocalechange", onChange);
        setLanguage(getLanguage());
        return () => window.removeEventListener("gallerylocalechange", onChange);
    }, []);

    return {
        language,
        setLanguage,
        t: (key) => translate(language, key),
    };
}
