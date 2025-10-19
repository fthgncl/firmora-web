import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import i18n from '../services/i18n';
import {useAuth} from "../contexts/AuthContext";
import {usePermissions} from "../contexts/PermissionsContext";
import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
    const { t } = useTranslation(['language']);
    const { token } = useAuth();
    const { refreshPermissions } = usePermissions();
    const [menuOpen, setMenuOpen] = useState(null);
    const [, forceUpdate] = useState({});

    // i18n event'lerini dinle
    useEffect(() => {
        const handleLanguageChanged = () => {
            if (token) {
                refreshPermissions();
            }
            forceUpdate({}); // Component'i yeniden render et
        };

        const handleInitialized = () => {
            forceUpdate({}); // Component'i yeniden render et
        };

        i18n.on('languageChanged', handleLanguageChanged);
        i18n.on('initialized', handleInitialized);

        if (i18n.isInitialized) {
            forceUpdate({});
        }

        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
            i18n.off('initialized', handleInitialized);
        };
        // eslint-disable-next-line
    }, [token]);

    // i18n resources'tan mevcut dilleri çek
    const availableLanguages = Object.keys(i18n.store?.data || {});

    // Dil kodunu normalize et - i18n.language "tr-TR" olabilir ama store'da "tr" olarak tutulur
    const getNormalizedLanguageCode = () => {
        const rawLang = i18n.language;
        if (i18n.store?.data?.[rawLang]) return rawLang;

        const shortLang = rawLang.split('-')[0];
        if (i18n.store?.data?.[shortLang]) return shortLang;

        return rawLang;
    };

    const currentLanguage = getNormalizedLanguageCode();

    const handleOpenMenu = (event) => {
        setMenuOpen(event.currentTarget);
    };

    const handleSelectFlag = (languageCode) => {
        i18n.changeLanguage(languageCode);
        handleClose();
    }

    const handleClose = () => {
        setMenuOpen(null);
    };

    // Mevcut dil bilgilerini al
    const getCurrentLanguageData = () => {
        if (!i18n.store?.data || !currentLanguage) {
            return { code: i18n.language, flag: null };
        }

        const languageData = i18n.store.data[currentLanguage];
        if (!languageData) {
            return { code: i18n.language, flag: null };
        }

        // Flag'i hem namespace dışında hem de içinde aramayı dene (i18n kaynak yapına göre)
        const flag = languageData.flag || languageData.translation?.flag || null;

        return {
            code: currentLanguage,
            flag: flag
        };
    };

    const currentLanguageData = getCurrentLanguageData();

    const getLanguageName = (code) => t(`language:languages.${code}`, { defaultValue: code.toUpperCase() });

    return (
        <div>
            <Button
                onClick={handleOpenMenu}
                aria-label={t('language:openMenu')}
                title={t('language:currentLanguage', { name: getLanguageName(currentLanguageData.code) })}
            >
                {currentLanguageData.flag && (
                    <img
                        src={currentLanguageData.flag}
                        alt={getLanguageName(currentLanguageData.code)}
                        style={{ width:'40px', height: 'auto' }}
                    />
                )}
            </Button>
            <Menu
                id="language-selector-menu"
                aria-labelledby="language-selector-button"
                anchorEl={menuOpen}
                open={!!menuOpen}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
            >
                {availableLanguages.map((languageCode) => {
                    if (languageCode === currentLanguage) return null;

                    const languageData = i18n.store.data[languageCode];
                    const flag = languageData?.flag || languageData?.translation?.flag || null;

                    return (
                        <MenuItem
                            key={languageCode}
                            onClick={() => handleSelectFlag(languageCode)}
                            aria-label={t('language:selectLanguage', { name: getLanguageName(languageCode) })}
                        >
                            {flag && (
                                <img
                                    src={flag}
                                    alt={getLanguageName(languageCode)}
                                    style={{width: '40px', height: 'auto'}}
                                />
                            )}
                        </MenuItem>
                    );
                })}
            </Menu>
        </div>
    );
}
