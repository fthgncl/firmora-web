import { useTranslation } from 'react-i18next';

export default function HomePage() {
    const { t, i18n } = useTranslation();

    return (
        <div>
            <h1>{t('welcome')}</h1>
            Home Page
        </div>
    );
}