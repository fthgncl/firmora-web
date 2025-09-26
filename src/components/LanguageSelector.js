import { useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import i18n from '../services/i18n';

export default function LanguageSelector() {
    const [menuOpen, setMenuOpen] = useState(null);

    // i18n resources'tan mevcut dilleri çek
    const availableLanguages = Object.keys(i18n.store.data);
    const currentLanguage = i18n.language;

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
        const resources = i18n.store.data[currentLanguage];
        return {
            code: currentLanguage,
            flag: resources?.flag || null
        };
    };

    const currentLanguageData = getCurrentLanguageData();

    return (
        <div>
            <Button onClick={handleOpenMenu}>
                {currentLanguageData.flag && (
                    <img
                        src={currentLanguageData.flag}
                        alt={currentLanguageData.code}
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

                    const languageResources = i18n.store.data[languageCode];
                    const flag = languageResources?.flag;

                    return (
                        <MenuItem 
                            key={languageCode} 
                            onClick={() => handleSelectFlag(languageCode)}
                        >
                            {flag && (
                                <img
                                    src={flag}
                                    alt={languageCode}
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