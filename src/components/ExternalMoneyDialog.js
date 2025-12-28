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
    AttachFile,
    CameraAlt,
    Clear,
    InsertDriveFile,
    Image,
    PictureAsPdf,
} from '@mui/icons-material';
import { Stack, Tooltip } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { permissionsService } from '../services/permissionsService';
import { useTranslation } from 'react-i18next';

export default function ExternalMoneyDialog({ open, onClose, targetAccount = null, targetScope = 'user', handleSuccess }) {
    const { t } = useTranslation(['externalMoney']);
    const { token, user } = useAuth();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState([]);

    // Dosya ikonlarını belirle
    const getFileIcon = (file) => {
        if (file.type === 'application/pdf') return <PictureAsPdf sx={{ color: '#d32f2f' }} />;
        if (file.type.startsWith('image/')) return <Image sx={{ color: '#1976d2' }} />;
        return <InsertDriveFile />;
    };

    // Dosya seçme handler'ı
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files || []);
        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
            if (!isValidType) showAlert(t('errors.invalidFileType'), 'error');
            if (!isValidSize) showAlert(t('errors.fileTooLarge'), 'error');
            return isValidType && isValidSize;
        });
        setAttachedFiles(prev => [...prev, ...validFiles]);
    };

    // Dosya silme handler'ı
    const handleRemoveFile = (index) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

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

            const formData = new FormData();
            formData.append('company_id', user.companyId || (targetAccount?.company?.id || targetAccount?.id));
            formData.append('transfer_type', transferType);
            formData.append('from_scope', 'external');
            formData.append('to_scope', targetScope);
            formData.append('from_external_name', values.fromExternalName);
            formData.append('amount', parseFloat(values.amount));
            formData.append('currency', targetAccount?.currency || 'EUR');

            if (targetScope === 'user') {
                formData.append('to_user_id', user.id);
            }

            if (values.description) {
                formData.append('description', values.description);
            }

            // Dosyaları ekle
            attachedFiles.forEach((file) => {
                formData.append('attachments', file);
            });

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/transfers/create`,
                formData,
                {
                    headers: {
                        'x-access-token': token,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (response.data.status === 'success') {
                showAlert(t('messages.addSuccess'), 'success');
                formik.resetForm();
                setAttachedFiles([]);
                onClose();

                if (typeof handleSuccess === 'function') {
                    handleSuccess();
                }

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
                        sx={{ mb: 3 }}
                    />

                    {/* Dosya Yükleme Bölümü */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            {t('fields.attachments.label', { defaultValue: 'Dosya Ekleri' })} ({t('fields.attachments.optional', { defaultValue: 'Opsiyonel' })})
                        </Typography>

                        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<AttachFile />}
                                size="small"
                                sx={{ borderRadius: 2, textTransform: 'none' }}
                            >
                                {t('actions.attachFiles', { defaultValue: 'Dosya Ekle' })}
                                <input
                                    type="file"
                                    hidden
                                    multiple
                                    accept="image/*,application/pdf"
                                    onChange={handleFileSelect}
                                />
                            </Button>

                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<CameraAlt />}
                                size="small"
                                sx={{ display: { xs: 'inline-flex', sm: 'none' }, borderRadius: 2, textTransform: 'none' }}
                            >
                                {t('actions.takePhoto', { defaultValue: 'Fotoğraf Çek' })}
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleFileSelect}
                                />
                            </Button>
                        </Stack>

                        {attachedFiles.length > 0 && (
                            <Stack spacing={1}>
                                {attachedFiles.map((file, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 1.5,
                                            bgcolor: 'rgba(0,0,0,0.03)',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            {getFileIcon(file)}
                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                                                    {file.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </Typography>
                                            </Box>
                                            <Tooltip title={t('actions.remove', { defaultValue: 'Kaldır' })}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRemoveFile(index)}
                                                >
                                                    <Clear fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>
                        )}

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {t('fields.attachments.hint', { defaultValue: 'Resim veya PDF dosyaları yükleyebilirsiniz (Maks. 10MB)' })}
                        </Typography>
                    </Box>
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
