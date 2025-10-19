import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
} from '@mui/material';
import {
    TrendingUp,
    Close,
    AccountBalance,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { permissionsService } from '../services/permissionsService';
import { useTranslation } from 'react-i18next';

export default function ExternalMoneyDialog({ open, onClose, targetAccount = null, targetScope = 'user' }) {
    const { t } = useTranslation(['externalMoney']);
    const { token, user } = useAuth();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);

    // targetScope'a göre transfer türünü belirle
    const transferType = targetScope === 'user' ? 'external_to_user' : 'external_to_company';
    const requiredPermission = targetScope === 'user' ? 'can_receive_external_to_user' : 'can_receive_external_to_company';

    // Yetki kontrolü
    useEffect(() => {
        const checkPermissions = async () => {
            if (!targetAccount || !user || !token) return;
            const companyId = targetAccount.company?.id || targetAccount.id;
            try {
                const permission = await permissionsService.checkUserRoles(
                    token,
                    user,
                    companyId,
                    [requiredPermission]
                );
                setHasPermission(permission);
            } catch (error) {
                console.error('Yetki kontrolü hatası:', error);
                setHasPermission(false);
            }
        };
        if (open) {
            checkPermissions();
        }
    }, [open, targetAccount, user, token, requiredPermission]);

    // Yup şeması (çeviri ile)
    const buildValidationSchema = () =>
        Yup.object({
            amount: Yup.number()
                .required(t('validation.amount.required'))
                .positive(t('validation.amount.positive'))
                .test('max-decimals', t('validation.amount.maxDecimals'), function (value) {
                    if (!value && value !== 0) return true;
                    const decimals = (value.toString().split('.')[1] || '').length;
                    return decimals <= 2;
                }),
            fromExternalName: Yup.string()
                .required(t('validation.fromExternalName.required'))
                .max(255, t('validation.fromExternalName.max')),
            description: Yup.string().max(255, t('validation.description.max')),
        });

    const formik = useFormik({
        initialValues: {
            amount: '',
            fromExternalName: '',
            description: '',
        },
        validationSchema: buildValidationSchema(),
        enableReinitialize: true,
        onSubmit: async (values) => {
            await handleExternalTransfer(values);
        },
    });

    // Dil değiştiğinde Yup mesajlarını güncelle (opsiyonel ama faydalı)
    useEffect(() => {
        formik.setErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]);

    const handleExternalTransfer = async (values) => {
        try {
            setLoading(true);

            const requestData = {
                company_id: user.companyId || (targetAccount?.company?.id || targetAccount?.id),
                transfer_type: transferType,
                from_scope: 'external',
                to_scope: targetScope,
                from_external_name: values.fromExternalName,
                amount: parseFloat(values.amount),
                currency: targetAccount?.currency || 'EUR',
            };

            if (targetScope === 'user') {
                requestData.to_user_id = user.id;
            }

            if (values.description) {
                requestData.description = values.description;
            }

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/transfers`,
                requestData,
                {
                    headers: {
                        'x-access-token': token,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.status === 'success') {
                showAlert(t('messages.addSuccess'), 'success');
                formik.resetForm();
                onClose();
            } else {
                showAlert(response.data.message || t('errors.addFailed'), 'error');
            }
        } catch (error) {
            console.error('Gelir ekleme hatası:', error);
            if (error.response?.data?.message) {
                showAlert(error.response.data.message, 'error');
            } else if (error.message) {
                showAlert(error.message, 'error');
            } else {
                showAlert(t('errors.generic'), 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle
                sx={{
                    fontWeight: 700,
                    fontSize: '1.5rem',
                    borderBottom: 1,
                    borderColor: 'divider',
                    pb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TrendingUp color="success" />
                    {targetScope === 'user' ? t('titles.addToUser') : t('titles.addToCompany')}
                </Box>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        color: 'text.secondary',
                        '&:hover': { color: 'text.primary', backgroundColor: 'action.hover' }
                    }}
                    aria-label={t('actions.close')}
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <form onSubmit={formik.handleSubmit}>
                <DialogContent sx={{ mt: 2 }}>
                    {!hasPermission && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {t('errors.noPermission')}
                            </Typography>
                        </Alert>
                    )}

                    {hasPermission && (
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {targetScope === 'user' ? t('info.userTitle') : t('info.companyTitle')}
                            </Typography>
                            <Typography variant="body2">
                                {t('info.description')}
                            </Typography>
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        label={t('fields.fromExternalName.label')}
                        name="fromExternalName"
                        value={formik.values.fromExternalName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.fromExternalName && Boolean(formik.errors.fromExternalName)}
                        helperText={formik.touched.fromExternalName && formik.errors.fromExternalName}
                        placeholder={t('fields.fromExternalName.placeholder')}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <AccountBalance />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        label={t('fields.amount.label')}
                        name="amount"
                        type="number"
                        inputProps={{ step: '0.01', min: '0' }}
                        value={formik.values.amount}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.amount && Boolean(formik.errors.amount)}
                        helperText={formik.touched.amount && formik.errors.amount}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {targetAccount?.currency || 'EUR'}
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        label={t('fields.description.label')}
                        name="description"
                        multiline
                        rows={3}
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.description && Boolean(formik.errors.description)}
                        helperText={formik.touched.description && formik.errors.description}
                        placeholder={t('fields.description.placeholder')}
                        inputProps={{ maxLength: 255 }}
                    />
                </DialogContent>

                <DialogActions
                    sx={{
                        px: 3,
                        pb: 3,
                        gap: 1,
                        borderTop: 1,
                        borderColor: 'divider',
                        pt: 2,
                    }}
                >
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        disabled={loading}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                        {t('actions.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        disabled={loading || !formik.isValid || !hasPermission}
                        startIcon={loading ? <CircularProgress size={20} /> : <TrendingUp />}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
                    >
                        {loading ? t('actions.adding') : t('actions.add')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
