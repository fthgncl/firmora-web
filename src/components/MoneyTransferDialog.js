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
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Alert,
    CircularProgress,
    InputAdornment,
    Chip,
    IconButton,
} from '@mui/material';
import {
    Send,
    AccountBalance,
    Person,
    Business,
    Receipt,
    Close,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { permissionsService } from '../services/permissionsService';

export default function MoneyTransferDialog({ open, onClose, sourceAccount = null, fromScope = 'user' }) {
    const { token, user } = useAuth();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState({
        canTransferInternal: false,
        canTransferExternal: false,
        canWithdrawFromCompany: false,
    });

    // Transfer tipleri ve açıklamaları
    const transferTypes = [
        {
            value: 'user_same_company',
            label: 'Aynı Firmadan Kullanıcıya',
            icon: <Person />,
            permission: 'canTransferInternal',
            description: 'Aynı firmadaki bir kullanıcıya para gönderin',
        },
        {
            value: 'user_other_company',
            label: 'Farklı Firmadan Kullanıcıya',
            icon: <Business />,
            permission: 'canTransferExternal',
            description: 'Başka bir firmadaki kullanıcıya para gönderin',
        },
        {
            value: 'external',
            label: 'Harici Ödeme',
            icon: <AccountBalance />,
            permission: 'canTransferExternal',
            description: 'Sistemde hesabı olmayan birine ödeme yapın',
        },
        {
            value: 'expense',
            label: 'Firma Gideri',
            icon: <Receipt />,
            permission: 'canTransferExternal',
            description: 'Firma gideri ödemesi kaydedin',
        },
    ];

    // Yetki kontrolü
    useEffect(() => {
        const checkPermissions = async () => {
            if (!sourceAccount || !user || !token) return;

            const companyId = sourceAccount.company?.id || sourceAccount.id;

            try {
                const canTransferInternal = await permissionsService.checkUserRoles(
                    token,
                    user,
                    companyId,
                    ['can_transfer_internal']
                );

                const canTransferExternal = await permissionsService.checkUserRoles(
                    token,
                    user,
                    companyId,
                    ['can_transfer_external']
                );

                const canWithdrawFromCompany = await permissionsService.checkUserRoles(
                    token,
                    user,
                    companyId,
                    ['can_withdraw_from_company']
                );

                setPermissions({
                    canTransferInternal,
                    canTransferExternal,
                    canWithdrawFromCompany,
                });
            } catch (error) {
                console.error('Yetki kontrolü hatası:', error);
            }
        };

        if (open) {
            checkPermissions();
        }
    }, [open, sourceAccount, user, token]);

    // Form validasyon şeması
    const validationSchema = Yup.object({
        transferType: Yup.string().required('Transfer tipi seçiniz'),
        amount: Yup.number()
            .required('Tutar giriniz')
            .positive('Tutar pozitif olmalıdır')
            .test('max-balance', 'Yetersiz bakiye', function(value) {
                if (!sourceAccount) return true;
                return value <= sourceAccount.balance;
            }),
        description: Yup.string()
            .required('Açıklama giriniz')
            .min(3, 'Açıklama en az 3 karakter olmalıdır'),
        toUserId: Yup.string().when('transferType', {
            is: (val) => val === 'user_same_company' || val === 'user_other_company',
            then: (schema) => schema.required('Kullanıcı ID giriniz'),
        }),
        toUserCompanyId: Yup.string().when('transferType', {
            is: 'user_other_company',
            then: (schema) => schema.required('Firma ID giriniz'),
        }),
        toExternalName: Yup.string().when('transferType', {
            is: 'external',
            then: (schema) => schema.required('Alıcı adı giriniz'),
        }),
        toExpenseName: Yup.string().when('transferType', {
            is: 'expense',
            then: (schema) => schema.required('Gider adı giriniz'),
        }),
    });

    const formik = useFormik({
        initialValues: {
            transferType: 'user_same_company',
            amount: '',
            description: '',
            toUserId: '',
            toUserCompanyId: '',
            toExternalName: '',
            toExpenseName: '',
        },
        validationSchema,
        onSubmit: async (values) => {
            await handleTransfer(values);
        },
    });

    const handleTransfer = async (values) => {
        try {
            setLoading(true);

            const requestData = {
                to_kind: values.transferType,
                from_scope: fromScope,
                amount: parseFloat(values.amount),
                currency: sourceAccount?.currency || 'EUR',
                description: values.description,
            };

            // Transfer tipine göre ek alanlar
            if (values.transferType === 'user_same_company' || values.transferType === 'user_other_company') {
                requestData.to_user_id = values.toUserId;
                if (values.transferType === 'user_other_company') {
                    requestData.to_user_company_id = values.toUserCompanyId;
                }
            } else if (values.transferType === 'external') {
                requestData.to_external_name = values.toExternalName;
            } else if (values.transferType === 'expense') {
                requestData.to_expense_name = values.toExpenseName;
            }

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/transfers`,
                requestData,
                {
                    headers: {
                        'x-access-token': token,
                    },
                }
            );

            if (response.data.success) {
                showAlert('Transfer başarıyla oluşturuldu', 'success');
                formik.resetForm();
                onClose();
            } else {
                showAlert(response.data.message || 'Transfer oluşturulamadı', 'error');
            }
        } catch (error) {
            console.error('Transfer hatası:', error);
            if (error.response?.data?.message) {
                showAlert(error.response.data.message, 'error');
            } else {
                showAlert('Transfer sırasında bir hata oluştu', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const isTransferTypeDisabled = (type) => {
        const transferType = transferTypes.find(t => t.value === type);
        if (!transferType) return true;
        return !permissions[transferType.permission];
    };

    const selectedTransferType = transferTypes.find(t => t.value === formik.values.transferType);

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
                    <Send color="primary" />
                    Para Transferi
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
                    {/* Kaynak hesap bilgisi */}
                    {sourceAccount && (
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Gönderen: {fromScope === 'user' ? 'Kişisel Hesap' : 'Firma Hesabı'}
                            </Typography>
                            <Typography variant="body2">
                                Mevcut Bakiye: {new Intl.NumberFormat('tr-TR', {
                                    style: 'currency',
                                    currency: sourceAccount.currency || 'EUR',
                                }).format(sourceAccount.balance)}
                            </Typography>
                        </Alert>
                    )}

                    {/* Transfer tipi seçimi */}
                    <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                        <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
                            Transfer Tipi
                        </FormLabel>
                        <RadioGroup
                            name="transferType"
                            value={formik.values.transferType}
                            onChange={formik.handleChange}
                        >
                            {transferTypes.map((type) => (
                                <Box key={type.value} sx={{ mb: 1 }}>
                                    <FormControlLabel
                                        value={type.value}
                                        disabled={isTransferTypeDisabled(type.value)}
                                        control={<Radio />}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {type.icon}
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                        {type.label}
                                                        {isTransferTypeDisabled(type.value) && (
                                                            <Chip 
                                                                label="Yetki Yok" 
                                                                size="small" 
                                                                color="error" 
                                                                sx={{ ml: 1, height: 20 }}
                                                            />
                                                        )}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {type.description}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        }
                                    />
                                </Box>
                            ))}
                        </RadioGroup>
                        {formik.touched.transferType && formik.errors.transferType && (
                            <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                                {formik.errors.transferType}
                            </Typography>
                        )}
                    </FormControl>

                    {/* Tutar */}
                    <TextField
                        fullWidth
                        label="Tutar"
                        name="amount"
                        type="number"
                        value={formik.values.amount}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.amount && Boolean(formik.errors.amount)}
                        helperText={formik.touched.amount && formik.errors.amount}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {sourceAccount?.currency || 'EUR'}
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 3 }}
                    />

                    {/* Dinamik alanlar - Transfer tipine göre */}
                    {(formik.values.transferType === 'user_same_company' || 
                      formik.values.transferType === 'user_other_company') && (
                        <>
                            <TextField
                                fullWidth
                                label="Alıcı Kullanıcı ID"
                                name="toUserId"
                                value={formik.values.toUserId}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.toUserId && Boolean(formik.errors.toUserId)}
                                helperText={formik.touched.toUserId && formik.errors.toUserId}
                                placeholder="USR123456"
                                sx={{ mb: 3 }}
                            />
                            {formik.values.transferType === 'user_other_company' && (
                                <TextField
                                    fullWidth
                                    label="Alıcı Firma ID"
                                    name="toUserCompanyId"
                                    value={formik.values.toUserCompanyId}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.toUserCompanyId && Boolean(formik.errors.toUserCompanyId)}
                                    helperText={formik.touched.toUserCompanyId && formik.errors.toUserCompanyId}
                                    placeholder="COM_123456"
                                    sx={{ mb: 3 }}
                                />
                            )}
                        </>
                    )}

                    {formik.values.transferType === 'external' && (
                        <TextField
                            fullWidth
                            label="Alıcı Adı / Firma Adı"
                            name="toExternalName"
                            value={formik.values.toExternalName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.toExternalName && Boolean(formik.errors.toExternalName)}
                            helperText={formik.touched.toExternalName && formik.errors.toExternalName}
                            placeholder="Tedarikçi A.Ş."
                            sx={{ mb: 3 }}
                        />
                    )}

                    {formik.values.transferType === 'expense' && (
                        <TextField
                            fullWidth
                            label="Gider Adı"
                            name="toExpenseName"
                            value={formik.values.toExpenseName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.toExpenseName && Boolean(formik.errors.toExpenseName)}
                            helperText={formik.touched.toExpenseName && formik.errors.toExpenseName}
                            placeholder="Ofis Malzemeleri"
                            sx={{ mb: 3 }}
                        />
                    )}

                    {/* Açıklama */}
                    <TextField
                        fullWidth
                        label="Açıklama"
                        name="description"
                        multiline
                        rows={3}
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.description && Boolean(formik.errors.description)}
                        helperText={formik.touched.description && formik.errors.description}
                        placeholder="Transfer açıklaması..."
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
                        disabled={loading || !formik.isValid}
                        startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                        sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                        }}
                    >
                        {loading ? 'Gönderiliyor...' : 'Gönder'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
