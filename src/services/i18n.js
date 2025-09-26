import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';

// Locales klasöründeki tüm JSON dosyalarını dinamik olarak yükle
const loadLocales = () => {
    const localeModules = require.context('../locales', false, /\.json$/);
    const resources = {};

    localeModules.keys().forEach((fileName) => {
        const languageCode = fileName.replace('./', '').replace('.json', '');
        resources[languageCode] = {
            translation: localeModules(fileName),
            flag: require(`../images/flags/${languageCode.toUpperCase()}.png`)
        };
    });

    return resources;
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: loadLocales(),
        fallbackLng: "en",
        interpolation: { escapeValue: false },
    });
