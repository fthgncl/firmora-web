import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import axios from "axios";

// 🌍 src/locales/{lng}/{namespace}.json yapısını destekler
const loadLocales = () => {
    const context = require.context("../locales", true, /\.json$/);
    const resources = {};

    context.keys().forEach((path) => {
        // Örnek path: ./en/common.json → ['en', 'common']
        const parts = path.replace("./", "").split("/");
        const lng = parts[0];
        const ns = parts[1].replace(".json", "");

        if (!resources[lng]) {
            resources[lng] = { flag: require(`../images/flags/${lng.toUpperCase()}.png`), };
        }
        if (!resources[lng].translation) resources[lng].translation = {};

        resources[lng].translation[ns] = context(path);
    });

    return resources;
};

const resources = loadLocales();

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "en",
        ns: Object.keys(resources.en?.translation || {}), // namespace’leri otomatik alır
        defaultNS: "common",
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
