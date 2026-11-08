import { useEffect, useState } from "react";
import type { Language } from "../i18n";

export default function usePreferences() {
    const [theme, setTheme] = useState(
        () => localStorage.getItem("lm-theme") || "light",
    );
    const [accent, setAccent] = useState<"green" | "blue">(() =>
        localStorage.getItem("lm-accent") === "blue" ? "blue" : "green",
    );
    const [language, setLanguage] = useState<Language>(() =>
        localStorage.getItem("lm-language") === "en" ? "en" : "tr",
    );

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.dataset.accent = accent;
        localStorage.setItem("lm-theme", theme);
        localStorage.setItem("lm-accent", accent);
        localStorage.setItem("lm-language", language);
    }, [theme, accent, language]);

    const changeAccent = (nextAccent: "green" | "blue") => {
        document.documentElement.dataset.accent = nextAccent;
        localStorage.setItem("lm-accent", nextAccent);
        setAccent(nextAccent);
    };

    return {
        theme,
        setTheme,
        accent,
        changeAccent,
        language,
        setLanguage,
    };
}
