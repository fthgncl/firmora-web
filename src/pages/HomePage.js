import {useTranslation} from 'react-i18next';
import AppBar from "../components/AppBar";

export default function HomePage() {
    const {t, i18n} = useTranslation();
    const currentLanguage = i18n.language;

    return (
        <>
            <AppBar/>
            <div>
                <div style={{marginBottom: '20px'}}>
                    <img
                        src={i18n.store.data.tr.flag}
                        alt={`${currentLanguage} flag`}
                        style={{width: '32px', height: '24px', marginRight: '10px'}}
                    />
                    <span>Current Language: {currentLanguage.toUpperCase()}</span>
                </div>
                <h1>{t('welcome')}</h1>
                Home Page
            </div>
        </>
    );
}