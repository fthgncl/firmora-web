import * as Yup from 'yup';
import i18n from '../services/i18n';

const t = (key) => i18n.t(`validationCompany:${key}`);

/**
 * Firma oluşturma formu için validasyon şeması
 * Veritabanı şemasına uygun olarak tasarlanmıştır:
 * - company_name: VARCHAR(50), en az 2 karakter
 * - sector: VARCHAR(50), nullable
 * - currency: VARCHAR(3), büyük harf ISO kodu
 */
export const createCompanyValidationSchema = Yup.object({
    company_name: Yup.string()
        .min(2, t('company_name.min'))
        .max(50, t('company_name.max'))
        .required(t('company_name.required'))
        .trim(),
    sector: Yup.string()
        .max(50, t('sector.max'))
        .nullable(),
    currency: Yup.string()
        .length(3, t('currency.length'))
        .matches(/^[A-Z]{3}$/, t('currency.format'))
        .required(t('currency.required')),
});

/**
 * Firma güncelleme formu için validasyon şeması
 * Tüm alanlar opsiyonel (sadece gönderilen alanlar güncellenir)
 */
export const updateCompanyValidationSchema = Yup.object({
    company_name: Yup.string()
        .min(2, t('company_name.min'))
        .max(50, t('company_name.max'))
        .trim(),
    sector: Yup.string()
        .max(50, t('sector.max'))
        .nullable(),
    currency: Yup.string()
        .length(3, t('currency.length'))
        .matches(/^[A-Z]{3}$/, t('currency.format')),
});

/**
 * Firma oluşturma formu için başlangıç değerleri
 */
export const createCompanyInitialValues = {
    company_name: '',
    sector: '',
    currency: 'USD', // Veritabanı varsayılanı
};
