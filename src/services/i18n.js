import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';
import axios from 'axios';

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

// Axios interceptor ile tüm isteklere dil header'ını ekle
axios.interceptors.request.use((config) => {
    config.headers['Accept-Language'] = i18n.language;
    return config;
});

// Dil değiştiğinde interceptor'ı güncelle
// TODO: Accept-Language değiştiği zaman diğer siteleri de etkiliyor. Bunun yerine başka bir key değiştirsin. API tarafı o keyi kontrol etsin. Eğer o key yoksa Accept-Language göre hareket etsin.
i18n.on('languageChanged', (lng) => {
    // Mevcut interceptor'ları temizle ve yeniden ekle
    axios.interceptors.request.clear();
    axios.interceptors.request.use((config) => {
        config.headers['x-language'] = lng;
        return config;
    });
});

export default i18n;
