import * as yup from 'yup';

const companySettingsSchema = yup.object().shape({
    company_name: yup
        .string()
        .required('Firma adı zorunludur')
        .min(2, 'Firma adı en az 2 karakter olmalıdır')
        .max(100, 'Firma adı en fazla 100 karakter olabilir'),

    sector: yup
        .string()
        .max(50, 'Sektör en fazla 50 karakter olabilir'),

    currency: yup
        .string()
        .oneOf(['TRY', 'USD', 'EUR', 'GBP'], 'Geçersiz para birimi')
        .required('Para birimi zorunludur'),
});

export default companySettingsSchema;
