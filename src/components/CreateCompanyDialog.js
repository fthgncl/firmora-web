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
import { useTranslation } from 'react-i18next';

export default function CreateCompanyDialog({ open, onClose, onCompanyCreated, token }) {
    const { t } = useTranslation(['companies']);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { showSuccess } = useAlert();
    const [formError, setFormError] = useState('');

    const formik = useFormik({
        initialValues: createCompanyInitialValues,
        validationSchema: createCompanyValidationSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                setFormError('');

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
                    // Başarı mesajı
                    const successMsg = response.data.message
                        || t('companies:createDialog.messages.created', { name: values.company_name });
                    showSuccess(successMsg, t('companies:createDialog.titles.success'));

                    if (onCompanyCreated) onCompanyCreated();

                    resetForm();
                    handleClose();
                }
            } catch (err) {
                console.error('Firma oluşturma hatası:', err);

                let errorMessage = t('companies:createDialog.errors.createFailed');

                if (err.response) {
                    switch (err.response.status) {
                        case 400:
                            errorMessage = t('companies:createDialog.errors.badRequest');
                            break;
                        case 403:
                            errorMessage = t('companies:createDialog.errors.forbidden');
                            break;
                        case 409:
                            errorMessage = t('companies:createDialog.errors.conflict');
                            break;
                        default:
                            errorMessage = err.response.data.message || errorMessage;
                    }
                } else if (err.request) {
                    errorMessage = t('companies:createDialog.errors.network');
                } else {
                    errorMessage = t('companies:createDialog.errors.unexpected');
                }

                setFormError(errorMessage);
            } finally {
                setSubmitting(false);
            }
        }
    });

    const handleClose = () => {
        formik.resetForm();
        setFormError('');
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
                    {t('companies:createDialog.title')}
                </Typography>
                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleClose}
                    aria-label={t('companies:createDialog.actions.close')}
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
                        label={t('companies:createDialog.fields.companyName')}
                        name="company_name"
                        value={formik.values.company_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.company_name && Boolean(formik.errors.company_name)}
                        helperText={formik.touched.company_name && formik.errors.company_name}
                        disabled={formik.isSubmitting}
                        margin="normal"
                        variant="outlined"
                        placeholder={t('companies:createDialog.placeholders.companyName')}
                        inputProps={{ maxLength: 50 }}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label={t('companies:createDialog.fields.sector')}
                        name="sector"
                        value={formik.values.sector}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.sector && Boolean(formik.errors.sector)}
                        helperText={formik.touched.sector && formik.errors.sector}
                        disabled={formik.isSubmitting}
                        margin="normal"
                        variant="outlined"
                        placeholder={t('companies:createDialog.placeholders.sector')}
                        inputProps={{ maxLength: 50 }}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        select
                        label={t('companies:createDialog.fields.currency')}
                        name="currency"
                        value={formik.values.currency}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.currency && Boolean(formik.errors.currency)}
                        helperText={(formik.touched.currency && formik.errors.currency) || t('companies:createDialog.helpers.currency')}
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
                        {t('companies:createDialog.actions.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={formik.isSubmitting}
                        startIcon={formik.isSubmitting ? <CircularProgress size={20} /> : null}
                    >
                        {formik.isSubmitting ? t('companies:createDialog.actions.creating') : t('companies:createDialog.actions.create')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
