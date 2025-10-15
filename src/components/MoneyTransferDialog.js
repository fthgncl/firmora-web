import React, { useState, useEffect, useMemo } from 'react';
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
    Close,
    SwapHoriz,
    TrendingUp,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { permissionsService } from '../services/permissionsService';
import UserSearchField from './UserSearchField';

export default function MoneyTransferDialog({ open, onClose, sourceAccount = null, fromScope = 'user' }) {
    const { token, user } = useAuth();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [permissions, setPermissions] = useState({});

    // Tüm transfer senaryoları - API'ye göre
    const allTransferTypes = [
        // COMPANY kaynaklı transferler
        {
            value: 'company_to_user_same',
            label: 'Aynı Firmadaki Kullanıcıya',
            icon: <Person />,
            fromScope: 'company',
            toScope: 'user',
            permission: 'can_transfer_company_to_same_company_user',
            description: 'Firma hesabından aynı firmadaki kullanıcıya transfer',
            requiresUser: true,
            requiresOtherCompany: false,
        },
        {
            value: 'company_to_user_other',
            label: 'Başka Firmadaki Kullanıcıya',
            icon: <Business />,
            fromScope: 'company',
            toScope: 'user',
            permission: 'can_transfer_company_to_other_company_user',
            description: 'Firma hesabından başka firmadaki kullanıcıya transfer',
            requiresUser: true,
            requiresOtherCompany: true,
        },
        {
            value: 'company_to_company_other',
            label: 'Başka Firmaya',
            icon: <Business />,
            fromScope: 'company',
            toScope: 'company',
            permission: 'can_transfer_company_to_other_company',
            description: 'Firma hesabından başka bir firmaya transfer',
            requiresUser: false,
            requiresOtherCompany: true,
        },
        {
            value: 'company_to_external',
            label: 'Harici Alıcıya',
            icon: <AccountBalance />,
            fromScope: 'company',
            toScope: 'external',
            permission: 'can_transfer_company_to_other_company',
            description: 'Firma hesabından sistem dışı alıcıya transfer',
            requiresUser: false,
            requiresOtherCompany: false,
            requiresExternal: true,
        },
        // USER kaynaklı transferler
        {
            value: 'user_to_user_same',
            label: 'Aynı Firmadaki Kullanıcıya',
            icon: <Person />,
            fromScope: 'user',
            toScope: 'user',
            permission: 'can_transfer_user_to_same_company_user',
            description: 'Kullanıcı hesabından aynı firmadaki kullanıcıya transfer',
            requiresUser: true,
            requiresOtherCompany: false,
        },
        {
            value: 'user_to_user_other',
            label: 'Başka Firmadaki Kullanıcıya',
            icon: <Business />,
            fromScope: 'user',
            toScope: 'user',
            permission: 'can_transfer_user_to_other_company_user',
            description: 'Kullanıcı hesabından başka firmadaki kullanıcıya transfer',
            requiresUser: true,
            requiresOtherCompany: true,
        },
        {
            value: 'user_to_company_same',
            label: 'Kendi Firmasına',
            icon: <TrendingUp />,
            fromScope: 'user',
            toScope: 'company',
            permission: 'can_transfer_user_to_own_company',
            description: 'Kullanıcı hesabından kendi firmasına transfer',
            requiresUser: false,
            requiresOtherCompany: false,
        },
        {
            value: 'user_to_company_other',
            label: 'Başka Firmaya',
            icon: <SwapHoriz />,
            fromScope: 'user',
            toScope: 'company',
            permission: 'can_transfer_user_to_other_company',
            description: 'Kullanıcı hesabından başka firmaya transfer',
            requiresUser: false,
            requiresOtherCompany: true,
        },
        {
            value: 'user_to_external',
            label: 'Harici Alıcıya',
            icon: <AccountBalance />,
            fromScope: 'user',
            toScope: 'external',
            permission: 'can_transfer_user_to_other_company',
            description: 'Kullanıcı hesabından sistem dışı alıcıya transfer',
            requiresUser: false,
            requiresOtherCompany: false,
            requiresExternal: true,
        },
    ];

    // fromScope'a göre transfer tiplerini filtrele
    const transferTypes = useMemo(() => {
        return allTransferTypes.filter(type => type.fromScope === fromScope);
        // eslint-disable-next-line
    }, [fromScope]);

    // İlk geçerli transfer tipini bul
    const getInitialTransferType = () => {
        const enabledType = transferTypes.find(type => permissions[type.permission]);
        return enabledType ? enabledType.value : (transferTypes[0]?.value || '');
    };

    // Yetki kontrolü
    useEffect(() => {
        const checkPermissions = async () => {
            if (!sourceAccount || !user || !token) return;

            const companyId = sourceAccount.company?.id || sourceAccount.id;

            try {
                const permissionCodes = [
                    'can_transfer_company_to_same_company_user',
                    'can_transfer_company_to_other_company_user',
                    'can_transfer_company_to_other_company',
                    'can_transfer_user_to_same_company_user',
                    'can_transfer_user_to_other_company_user',
                    'can_transfer_user_to_own_company',
                    'can_transfer_user_to_other_company',
                ];

                const permissionResults = {};
                for (const code of permissionCodes) {
                    permissionResults[code] = await permissionsService.checkUserRoles(
                        token,
                        user,
                        companyId,
                        [code]
                    );
                }

                setPermissions(permissionResults);
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
            .test('max-decimals', 'En fazla 2 ondalık basamak olabilir', function(value) {
                if (!value) return true;
                const decimals = (value.toString().split('.')[1] || '').length;
                return decimals <= 2;
            })
            .test('max-balance', 'Yetersiz bakiye', function(value) {
                if (!sourceAccount) return true;
                return value <= sourceAccount.balance;
            }),
        description: Yup.string()
            .max(255, 'Açıklama en fazla 255 karakter olabilir'),
        toUserId: Yup.string().when('transferType', {
            is: (val) => {
                const type = allTransferTypes.find(t => t.value === val);
                return type?.requiresUser;
            },
            then: (schema) => schema.required('Kullanıcı seçiniz'),
        }),
        toUserCompanyId: Yup.string().when('transferType', {
            is: (val) => {
                const type = allTransferTypes.find(t => t.value === val);
                return type?.requiresOtherCompany;
            },
            then: (schema) => schema.required('Firma ID gerekli'),
        }),
        toExternalName: Yup.string().when('transferType', {
            is: (val) => {
                const type = allTransferTypes.find(t => t.value === val);
                return type?.requiresExternal;
            },
            then: (schema) => schema.required('Alıcı adı giriniz'),
        }),
    });

    const formik = useFormik({
        initialValues: {
            transferType: '',
            amount: '',
            description: '',
            toUserId: '',
            toUserCompanyId: '',
            toExternalName: '',
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            await handleTransfer(values);
        },
    });

    // İlk transfer tipini ayarla
    useEffect(() => {
        if (open && transferTypes.length > 0 && !formik.values.transferType) {
            formik.setFieldValue('transferType', getInitialTransferType());
        }
        // eslint-disable-next-line
    }, [open, transferTypes, permissions]);

    // Kullanıcı seçildiğinde
    const handleUserSelect = (user) => {
        setSelectedUser(user);
        formik.setFieldValue('toUserId', user.id);

        // Eğer başka firma transferi ise company ID'yi set et
        const currentType = allTransferTypes.find(t => t.value === formik.values.transferType);
        if (currentType?.requiresOtherCompany && user.companyId) {
            formik.setFieldValue('toUserCompanyId', user.companyId);
        }
    };

    // Transfer tipi değiştiğinde seçilen kullanıcıyı temizle
    useEffect(() => {
        setSelectedUser(null);
        formik.setFieldValue('toUserId', '');
        formik.setFieldValue('toUserCompanyId', '');
        formik.setFieldValue('toExternalName', '');
        // eslint-disable-next-line
    }, [formik.values.transferType]);

    const handleTransfer = async (values) => {
        try {
            setLoading(true);

            const transferType = allTransferTypes.find(t => t.value === values.transferType);
            if (!transferType) {
                throw new Error('Geçersiz transfer tipi');
            }

            const requestData = {
                company_id: user.companyId || (sourceAccount?.company?.id || sourceAccount?.id),
                transfer_type: values.transferType,
                from_scope: transferType.fromScope,
                to_scope: transferType.toScope,
                amount: parseFloat(values.amount),
                currency: sourceAccount?.currency || 'EUR',
            };

            // Opsiyonel açıklama
            if (values.description) {
                requestData.description = values.description;
            }

            // Transfer tipine göre ek alanlar
            if (transferType.requiresUser) {
                requestData.to_user_id = values.toUserId;
            }

            if (transferType.requiresOtherCompany) {
                if (transferType.toScope === 'company') {
                    requestData.to_user_company_id = values.toUserCompanyId;
                } else if (transferType.toScope === 'user' && values.toUserCompanyId) {
                    requestData.to_user_company_id = values.toUserCompanyId;
                }
            }

            if (transferType.requiresExternal) {
                requestData.to_external_name = values.toExternalName;
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
                showAlert('Transfer başarıyla oluşturuldu', 'success');
                formik.resetForm();
                setSelectedUser(null);
                onClose();
            } else {
                showAlert(response.data.message || 'Transfer oluşturulamadı', 'error');
            }
        } catch (error) {
            console.error('Transfer hatası:', error);
            if (error.response?.data?.message) {
                showAlert(error.response.data.message, 'error');
            } else if (error.message) {
                showAlert(error.message, 'error');
            } else {
                showAlert('Transfer sırasında bir hata oluştu', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const isTransferTypeDisabled = (type) => {
        const transferType = allTransferTypes.find(t => t.value === type);
        if (!transferType) return true;
        return !permissions[transferType.permission];
    };

    const currentTransferType = allTransferTypes.find(t => t.value === formik.values.transferType);

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
                        inputProps={{ step: '0.01', min: '0' }}
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
                    {currentTransferType?.requiresUser && (
                        <>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Alıcı Kullanıcı
                                </Typography>
                                <UserSearchField
                                    companyId={sourceAccount?.company?.id || sourceAccount?.id}
                                    searchScope={currentTransferType.requiresOtherCompany ? 'all' : 'company'}
                                    onUserSelect={handleUserSelect}
                                    minWidth="100%"
                                />
                                {formik.touched.toUserId && formik.errors.toUserId && (
                                    <Typography color="error" variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                                        {formik.errors.toUserId}
                                    </Typography>
                                )}
                            </Box>

                            {/* Seçilen kullanıcı bilgisi */}
                            {selectedUser && (
                                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        Seçilen Kullanıcı
                                    </Typography>
                                    <Typography variant="body2">
                                        {selectedUser.name} {selectedUser.surname}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedUser.email}
                                    </Typography>
                                    {selectedUser.companyId && currentTransferType.requiresOtherCompany && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            Firma ID: {selectedUser.companyId}
                                        </Typography>
                                    )}
                                </Alert>
                            )}
                        </>
                    )}

                    {currentTransferType?.requiresOtherCompany && !currentTransferType?.requiresUser && (
                        <TextField
                            fullWidth
                            label="Hedef Firma ID"
                            name="toUserCompanyId"
                            value={formik.values.toUserCompanyId}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.toUserCompanyId && Boolean(formik.errors.toUserCompanyId)}
                            helperText={formik.touched.toUserCompanyId && formik.errors.toUserCompanyId}
                            placeholder="COM_xyz789uvw012"
                            sx={{ mb: 3 }}
                        />
                    )}

                    {currentTransferType?.requiresExternal && (
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
                        placeholder="Transfer açıklaması..."
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
                        disabled={loading || !formik.isValid || !formik.values.transferType}
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
