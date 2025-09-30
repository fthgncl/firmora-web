/**
 * Yaygın kullanılan para birimleri
 * ISO 4217 standartına uygun 3 harfli kodlar
 */
export const CURRENCY_OPTIONS = [
    { value: 'USD', label: 'USD - Amerikan Doları' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'TRY', label: 'TRY - Türk Lirası' },
    { value: 'GBP', label: 'GBP - İngiliz Sterlini' },
    { value: 'JPY', label: 'JPY - Japon Yeni' },
    { value: 'CHF', label: 'CHF - İsviçre Frangı' },
    { value: 'CAD', label: 'CAD - Kanada Doları' },
    { value: 'AUD', label: 'AUD - Avustralya Doları' },
    { value: 'CNY', label: 'CNY - Çin Yuanı' },
    { value: 'RUB', label: 'RUB - Rus Rublesi' }
];

/**
 * Varsayılan para birimi
 */
export const DEFAULT_CURRENCY = 'USD';

/**
 * Para birimi formatı regex pattern
 */
export const CURRENCY_REGEX = /^[A-Z]{3}$/;

/**
 * Para birimi kodlarını liste olarak döndürür
 */
export const getCurrencyCodes = () => CURRENCY_OPTIONS.map(option => option.value);

/**
 * Para birimi kodu için label döndürür
 * @param {string} code - Para birimi kodu (örn: 'USD')
 * @returns {string} - Label (örn: 'USD - Amerikan Doları')
 */
export const getCurrencyLabel = (code) => {
    const currency = CURRENCY_OPTIONS.find(option => option.value === code);
    return currency ? currency.label : code;
};
