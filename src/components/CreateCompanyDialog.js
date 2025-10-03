import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    IconButton,
    CircularProgress,
    useTheme,
    useMediaQuery,
    MenuItem,
    Alert
} from '@mui/material';
import { Close } from '@mui/icons-material';
import axios from 'axios';
import { useFormik } from 'formik';
import { useAlert } from '../contexts/AlertContext';
import { createCompanyValidationSchema, createCompanyInitialValues } from '../validations/companyValidation';
import { CURRENCY_OPTIONS } from '../constants/currency';

export default function CreateCompanyDialog({ open, onClose, onCompanyCreated, token }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { showSuccess } = useAlert();
    const [formError, setFormError] = useState('');

    const formik = useFormik({
        initialValues: createCompanyInitialValues,
        validationSchema: createCompanyValidationSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                setFormError(''); // Önceki hataları temizle

                const response = await axios.post(
                    `${process.env.REACT_APP_API_URL}/companies`,
                    {
                        company_name: values.company_name.trim(),
                        sector: values.sector?.trim() || null,
                        currency: values.currency.toUpperCase()
                    },
                    {
                        headers: {
                            'x-access-token': token,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.status === "success") {

                    // Önce başarı mesajını göster
                    showSuccess(
                        response.data.message || `${values.company_name} firması başarıyla oluşturuldu!`,
                        'İşlem Başarılı'
                    );

                    // Parent component'e bilgi gönder (firma listesini güncellemek için)
                    if (onCompanyCreated) {
                        onCompanyCreated();
                    }

                    // En son dialog'u kapat
                    resetForm();
                    handleClose();
                }
            } catch (err) {
                console.error('Firma oluşturma hatası:', err);

                let errorMessage = 'Firma oluşturulurken bir hata oluştu';

                if (err.response) {
                    switch (err.response.status) {
                        case 400:
                            errorMessage = 'Gerekli alanlar eksik veya hatalı';
                            break;
                        case 403:
                            errorMessage = 'Yetkiniz yetersiz (create_company yetkisi gerekli)';
                            break;
                        case 409:
                            errorMessage = 'Bu firma adı zaten mevcut';
                            break;
                        default:
                            errorMessage = err.response.data.message || errorMessage;
                    }
                } else if (err.request) {
                    errorMessage = 'Sunucuya ulaşılamıyor';
                } else {
                    errorMessage = 'Beklenmeyen bir hata oluştu';
                }

                // Hatayı form içinde göster
                setFormError(errorMessage);
            } finally {
                setSubmitting(false);
            }
        }
    });

    const handleClose = () => {
        formik.resetForm();
        setFormError(''); // Hata mesajını temizle
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullScreen={isMobile}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 2,
                    backgroundColor: 'background.paper'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'text.primary',
                borderBottom: `1px solid ${theme.palette.divider}`
            }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    Yeni Firma Oluştur
                </Typography>
                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleClose}
                    aria-label="close"
                    size="small"
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <form onSubmit={formik.handleSubmit}>
                <DialogContent sx={{ pt: 3 }}>
                    {formError && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>
                            {formError}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        label="Firma Adı"
                        name="company_name"
                        value={formik.values.company_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.company_name && Boolean(formik.errors.company_name)}
                        helperText={formik.touched.company_name && formik.errors.company_name}
                        disabled={formik.isSubmitting}
                        margin="normal"
                        variant="outlined"
                        placeholder="Örn: Acme Corporation"
                        inputProps={{ maxLength: 50 }}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Sektör"
                        name="sector"
                        value={formik.values.sector}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.sector && Boolean(formik.errors.sector)}
                        helperText={formik.touched.sector && formik.errors.sector}
                        disabled={formik.isSubmitting}
                        margin="normal"
                        variant="outlined"
                        placeholder="Örn: Teknoloji, Perakende, İmalat (Opsiyonel)"
                        inputProps={{ maxLength: 50 }}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        select
                        label="Para Birimi"
                        name="currency"
                        value={formik.values.currency}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.currency && Boolean(formik.errors.currency)}
                        helperText={(formik.touched.currency && formik.errors.currency) || '3 harfli ISO para birimi kodu'}
                        disabled={formik.isSubmitting}
                        margin="normal"
                        variant="outlined"
                        sx={{ mb: 1 }}
                    >
                        {CURRENCY_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>

                <DialogActions sx={{
                    px: 3,
                    pb: 3,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    pt: 2
                }}>
                    <Button
                        onClick={handleClose}
                        disabled={formik.isSubmitting}
                        color="inherit"
                    >
                        İptal
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={formik.isSubmitting}
                        startIcon={formik.isSubmitting ? <CircularProgress size={20} /> : null}
                    >
                        {formik.isSubmitting ? 'Oluşturuluyor...' : 'Oluştur'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
