import React, {useState} from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    CircularProgress,
    MenuItem,
    IconButton,
    Typography,
} from '@mui/material';
import { Close, Business } from '@mui/icons-material';
import { Formik, Form } from 'formik';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { useTranslation } from 'react-i18next';
import companySettingsSchema from '../schemas/companySettingsSchema';

const CURRENCIES = [
    { value: 'TRY', label: '₺ Türk Lirası (TRY)' },
    { value: 'USD', label: '$ Amerikan Doları (USD)' },
    { value: 'EUR', label: '€ Euro (EUR)' },
    { value: 'GBP', label: '£ İngiliz Sterlini (GBP)' },
];

export default function CompanySettingsDialog({ open, onClose, company, onUpdateSuccess }) {
    const { token } = useAuth();
    const { showAlert } = useAlert();
    const { t } = useTranslation(['company']);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (values, { setFieldError }) => {
        try {
            setSubmitting(true);

            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/companies`,
                {
                    companyId: company.id,
                    company_name: values.company_name || undefined,
                    sector: values.sector || undefined,
                    currency: values.currency || undefined,
                },
                {
                    headers: {
                        'x-access-token': token,
                    },
                }
            );

            if (response.data.status === 'success') {
                showAlert(
                    response.data.message || 'Firma bilgileri başarıyla güncellendi.',
                    'success'
                );
                if (onUpdateSuccess) {
                    onUpdateSuccess();
                }
                onClose();
            } else {
                showAlert(response.data.message || 'Güncelleme başarısız oldu.', 'error');
            }
        } catch (err) {
            console.error('Firma güncelleme hatası:', err);

            const errorMessage = err.response?.data?.message || 'Firma bilgileri güncellenirken bir hata oluştu.';

            if (err.response?.status === 403) {
                showAlert('Bu firmayı güncelleme yetkiniz yok. Sadece firma sahibi güncelleyebilir.', 'error');
            } else if (err.response?.status === 404) {
                showAlert('Firma bulunamadı.', 'error');
            } else if (err.response?.data?.errorMessages) {
                const errors = err.response.data.errorMessages;
                Object.keys(errors).forEach(key => {
                    setFieldError(key, errors[key]);
                });
            } else {
                showAlert(errorMessage, 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={submitting ? undefined : onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 1,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Business color="primary" />
                    <Typography variant="h6" component="span">
                        Firma Ayarları
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    disabled={submitting}
                    size="small"
                    sx={{ color: 'text.secondary' }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            {company && (
                <Formik
                    initialValues={{
                        company_name: company.company_name || '',
                        sector: company.sector || '',
                        currency: company.currency || 'TRY',
                    }}
                    validationSchema={companySettingsSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ values, errors, touched, handleChange, handleBlur }) => (
                        <Form>
                            <DialogContent dividers>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <TextField
                                        fullWidth
                                        label="Firma Adı"
                                        name="company_name"
                                        value={values.company_name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.company_name && Boolean(errors.company_name)}
                                        helperText={touched.company_name && errors.company_name}
                                        required
                                        disabled={submitting}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Sektör"
                                        name="sector"
                                        value={values.sector}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.sector && Boolean(errors.sector)}
                                        helperText={touched.sector && errors.sector}
                                        disabled={submitting}
                                    />

                                    <TextField
                                        fullWidth
                                        select
                                        label="Para Birimi"
                                        name="currency"
                                        value={values.currency}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.currency && Boolean(errors.currency)}
                                        helperText={touched.currency && errors.currency}
                                        required
                                        disabled={submitting}
                                    >
                                        {CURRENCIES.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                            </DialogContent>

                            <DialogActions sx={{ px: 3, py: 2 }}>
                                <Button
                                    onClick={onClose}
                                    disabled={submitting}
                                    color="inherit"
                                >
                                    İptal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={submitting}
                                    startIcon={submitting ? <CircularProgress size={20} /> : null}
                                >
                                    {submitting ? 'Güncelleniyor...' : 'Güncelle'}
                                </Button>
                            </DialogActions>
                        </Form>
                    )}
                </Formik>
            )}
        </Dialog>
    );
}
