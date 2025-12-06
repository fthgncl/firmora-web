import i18n from '../services/i18n';

export function getCurrencies() {
    return [
        { value: 'USD', label: `USD - ${i18n.t('currencies:usd')}` },
        { value: 'EUR', label: `EUR - ${i18n.t('currencies:eur')}` },
        { value: 'TRY', label: `TRY - ${i18n.t('currencies:try')}` },
        { value: 'GBP', label: `GBP - ${i18n.t('currencies:gbp')}` },
        { value: 'JPY', label: `JPY - ${i18n.t('currencies:jpy')}` },
        { value: 'CHF', label: `CHF - ${i18n.t('currencies:chf')}` },
        { value: 'CAD', label: `CAD - ${i18n.t('currencies:cad')}` },
        { value: 'AUD', label: `AUD - ${i18n.t('currencies:aud')}` },
        { value: 'CNY', label: `CNY - ${i18n.t('currencies:cny')}` },
        { value: 'RUB', label: `RUB - ${i18n.t('currencies:rub')}` }
    ];
}

