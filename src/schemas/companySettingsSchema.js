import * as yup from 'yup';

const companySettingsSchema = (t) => yup.object().shape({
    company_name: yup
        .string()
        .required(t('company:validation.companyNameRequired'))
        .min(2, t('company:validation.companyNameMin'))
        .max(100, t('company:validation.companyNameMax')),

    sector: yup
        .string()
        .max(50, t('company:validation.sectorMax')),

    currency: yup
        .string()
        .oneOf(['TRY', 'USD', 'EUR', 'GBP'], t('company:validation.currencyInvalid'))
        .required(t('company:validation.currencyRequired')),
});

export default companySettingsSchema;
