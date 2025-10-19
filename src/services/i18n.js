import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import axios from "axios";

// 🌍 src/locales/{lng}/{namespace}.json (namespace'ler kök seviyede) + flag desteği
const loadLocales = () => {
    const ctx = require.context("../locales", true, /\.json$/);
    const flagsCtx = require.context("../images/flags", false, /\.png$/);

    const resources = {};
    const namespaces = new Set();

    const getFlag = (lng) => {
        const key = `./${lng.toUpperCase()}.png`;
        return flagsCtx.keys().includes(key) ? flagsCtx(key) : null;
    };

    ctx.keys().forEach((p) => {
        const [lng, file] = p.replace("./", "").split("/");
        const ns = file.replace(".json", "");
        namespaces.add(ns);

        if (!resources[lng]) {
            // ⚑ Bayrak yeniden eklendi
            resources[lng] = { flag: getFlag(lng) };
        }

        resources[lng][ns] = ctx(p);
    });

    return { resources, namespaces: Array.from(namespaces) };
};

const { resources, namespaces } = loadLocales();

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "en",
        ns: namespaces,
        defaultNS: namespaces.includes("common") ? "common" : (namespaces[0] || "translation"),
        interpolation: { escapeValue: false },
    });

// 🔁 Axios dil header’ı
let interceptorId = axios.interceptors.request.use((config) => {
    config.headers["x-language"] = i18n.language;
    return config;
});

i18n.on("languageChanged", (lng) => {
    axios.interceptors.request.eject(interceptorId);
    interceptorId = axios.interceptors.request.use((config) => {
        config.headers["x-language"] = lng;
        return config;
    });
});

export default i18n;
