import * as Yup from 'yup';

/**
 * Firma oluşturma formu için validasyon şeması
 * Veritabanı şemasına uygun olarak tasarlanmıştır:
 * - company_name: VARCHAR(50), en az 2 karakter
 * - sector: VARCHAR(50), nullable
 * - currency: VARCHAR(3), büyük harf ISO kodu
 */
export const createCompanyValidationSchema = Yup.object({
    company_name: Yup.string()
        .min(2, 'Firma adı en az 2 karakter olmalıdır')
        .max(50, 'Firma adı en fazla 50 karakter olabilir')
        .required('Firma adı zorunludur')
        .trim(),
    sector: Yup.string()
        .max(50, 'Sektör en fazla 50 karakter olabilir')
        .nullable(),
    currency: Yup.string()
        .length(3, 'Para birimi kodu 3 karakter olmalıdır')
        .matches(/^[A-Z]{3}$/, 'Para birimi kodu 3 büyük harf olmalıdır (örn: USD, EUR, TRY)')
        .required('Para birimi zorunludur')
});

/**
 * Firma güncelleme formu için validasyon şeması
 * Tüm alanlar opsiyonel (sadece gönderilen alanlar güncellenir)
 */
export const updateCompanyValidationSchema = Yup.object({
    company_name: Yup.string()
        .min(2, 'Firma adı en az 2 karakter olmalıdır')
        .max(50, 'Firma adı en fazla 50 karakter olabilir')
        .trim(),
    sector: Yup.string()
        .max(50, 'Sektör en fazla 50 karakter olabilir')
        .nullable(),
    currency: Yup.string()
        .length(3, 'Para birimi kodu 3 karakter olmalıdır')
        .matches(/^[A-Z]{3}$/, 'Para birimi kodu 3 büyük harf olmalıdır (örn: USD, EUR, TRY)')
});

/**
 * Firma oluşturma formu için başlangıç değerleri
 */
export const createCompanyInitialValues = {
    company_name: '',
    sector: '',
    currency: 'USD' // Veritabanı varsayılanı
};
