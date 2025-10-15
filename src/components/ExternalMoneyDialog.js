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

export default function ExternalMoneyDialog({ open, onClose, targetAccount = null, targetScope = 'user' }) {
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

    // Form validasyon şeması
    const validationSchema = Yup.object({
        amount: Yup.number()
            .required('Tutar giriniz')
            .positive('Tutar pozitif olmalıdır')
            .test('max-decimals', 'En fazla 2 ondalık basamak olabilir', function(value) {
                if (!value) return true;
                const decimals = (value.toString().split('.')[1] || '').length;
                return decimals <= 2;
            }),
        fromExternalName: Yup.string()
            .required('Kaynak adı giriniz')
            .max(255, 'Kaynak adı en fazla 255 karakter olabilir'),
        description: Yup.string()
            .max(255, 'Açıklama en fazla 255 karakter olabilir'),
    });

    const formik = useFormik({
        initialValues: {
            amount: '',
            fromExternalName: '',
            description: '',
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            await handleExternalTransfer(values);
        },
    });

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

            // Kullanıcıya gidiyorsa, giriş yapan kullanıcının ID'sini kullan
            if (targetScope === 'user') {
                requestData.to_user_id = user.id;
            }

            // Opsiyonel açıklama
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
                showAlert('Gelir başarıyla eklendi', 'success');
                formik.resetForm();
                onClose();
            } else {
                showAlert(response.data.message || 'Gelir eklenemedi', 'error');
            }
        } catch (error) {
            console.error('Gelir ekleme hatası:', error);
            if (error.response?.data?.message) {
                showAlert(error.response.data.message, 'error');
            } else if (error.message) {
                showAlert(error.message, 'error');
            } else {
                showAlert('Gelir eklerken bir hata oluştu', 'error');
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
            PaperProps={{
                sx: {
                    borderRadius: 3,
                }
            }}
        >
            <DialogTitle sx={{ 
                fontWeight: 700,
                fontSize: '1.5rem',
                borderBottom: 1,
                borderColor: 'divider',
                pb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TrendingUp color="success" />
                    {targetScope === 'user' ? 'Kullanıcıya Gelir Ekle' : 'Firmaya Gelir Ekle'}
                </Box>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        color: 'text.secondary',
                        '&:hover': {
                            color: 'text.primary',
                            backgroundColor: 'action.hover',
                        }
                    }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <form onSubmit={formik.handleSubmit}>
                <DialogContent sx={{ mt: 2 }}>
                    {/* Yetki kontrolü */}
                    {!hasPermission && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Bu işlem için yetkiniz bulunmamaktadır.
                            </Typography>
                        </Alert>
                    )}

                    {/* Bilgilendirme */}
                    {hasPermission && (
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {targetScope === 'user' ? 'Kendi Hesabınıza Gelir Ekleme' : 'Firmaya Gelir Ekleme'}
                            </Typography>
                            <Typography variant="body2">
                                Sistem dışından gelen ödemeleri, müşteri ödemelerini veya banka transferlerini buradan kayıt altına alabilirsiniz.
                            </Typography>
                        </Alert>
                    )}

                    {/* Kaynak adı */}
                    <TextField
                        fullWidth
                        label="Kaynak / Gönderen Adı"
                        name="fromExternalName"
                        value={formik.values.fromExternalName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.fromExternalName && Boolean(formik.errors.fromExternalName)}
                        helperText={formik.touched.fromExternalName && formik.errors.fromExternalName}
                        placeholder="Örn: Müşteri Ödemesi - Ali Veli, XYZ Bank - Kredi"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <AccountBalance />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 3 }}
                    />

                    {/* Tutar */}
                    <TextField
                        fullWidth
                        label="Tutar"
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

                    {/* Açıklama */}
                    <TextField
                        fullWidth
                        label="Açıklama (Opsiyonel)"
                        name="description"
                        multiline
                        rows={3}
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.description && Boolean(formik.errors.description)}
                        helperText={formik.touched.description && formik.errors.description}
                        placeholder="Gelir ile ilgili ek bilgiler..."
                        inputProps={{ maxLength: 255 }}
                    />
                </DialogContent>

                <DialogActions sx={{ 
                    px: 3, 
                    pb: 3,
                    gap: 1,
                    borderTop: 1,
                    borderColor: 'divider',
                    pt: 2,
                }}>
                    <Button 
                        onClick={onClose}
                        variant="outlined"
                        disabled={loading}
                        sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        İptal
                    </Button>
                    <Button 
                        type="submit"
                        variant="contained"
                        color="success"
                        disabled={loading || !formik.isValid || !hasPermission}
                        startIcon={loading ? <CircularProgress size={20} /> : <TrendingUp />}
                        sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                        }}
                    >
                        {loading ? 'Ekleniyor...' : 'Gelir Ekle'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
