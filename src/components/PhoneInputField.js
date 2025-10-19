// src/components/PhoneInputField.js
import React, { forwardRef, useMemo } from 'react';
import Box from '@mui/material/Box';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useTranslation } from 'react-i18next';

// Dil paketleri
import tr from 'react-phone-number-input/locale/tr';
import en from 'react-phone-number-input/locale/en';
import de from 'react-phone-number-input/locale/de';

// Telefon girişi için özel bileşen - MUI TextField ile entegre olacak şekilde
const PhoneInputField = forwardRef(function PhoneInputField(props, ref) {
    const { defaultCountry, onChange, value, disabled, placeholder, error, touched, ...other } = props;
    const { i18n, t } = useTranslation();

    // Aktif dil için uygun label seti
    const labels = useMemo(() => {
        switch (i18n.language) {
            case 'tr':
                return tr;
            case 'de':
                return de;
            default:
                return en;
        }
    }, [i18n.language]);

    return (
        <Box
            sx={{
                '& .PhoneInput': {
                    display: 'flex',
                    width: '100%',
                    border: '1px solid',
                    borderColor: (touched && error) ? 'error.main' : 'divider',
                    borderRadius: 1,
                    backgroundColor: disabled ? 'action.disabledBackground' : 'background.paper',
                    transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    opacity: disabled ? 0.6 : 1,
                    '&:hover': {
                        borderColor: disabled ? 'divider' : (touched && error) ? 'error.main' : 'primary.main',
                    },
                    '&:focus-within': {
                        borderColor: (touched && error) ? 'error.main' : 'primary.main',
                        boxShadow: (theme) =>
                            `0 0 0 2px ${(touched && error)
                                ? theme.palette.error.main + '20'
                                : theme.palette.primary.main + '20'}`,
                    },
                },
                '& .PhoneInputCountry': {
                    marginLeft: '12px',
                    marginRight: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '56px',
                },
                '& .PhoneInputCountrySelect': {
                    border: 'none',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    color: 'text.primary',
                    cursor: disabled ? 'default' : 'pointer',
                },
                '& .PhoneInputInput': {
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    color: 'text.primary',
                    width: '100%',
                    padding: '16.5px 14px 16.5px 0',
                    minHeight: '22px',
                    '&::placeholder': {
                        color: 'text.secondary',
                        opacity: 1,
                    },
                },
            }}
        >
            <PhoneInput
                defaultCountry={defaultCountry}
                international
                labels={labels}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder || t('phoneInput.placeholder', 'Telefon numarası')}
                ref={ref}
                {...other}
            />
        </Box>
    );
});

export default PhoneInputField;
