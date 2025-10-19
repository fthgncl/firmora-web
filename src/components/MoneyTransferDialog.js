import React, {useState, useEffect, useMemo} from 'react';
import {useTranslation} from 'react-i18next';
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
import {useFormik} from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import {useAuth} from '../contexts/AuthContext';
import {useAlert} from '../contexts/AlertContext';
import {permissionsService} from '../services/permissionsService';
import UserSearchField from './UserSearchField';
import CompanySearchField from './CompanySearchField';

export default function MoneyTransferDialog({open, onClose, sourceAccount = null, fromScope = 'user'}) {
    const {t, i18n} = useTranslation(['transfers']);
    const {token, user} = useAuth();
    const {showAlert} = useAlert();
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [permissions, setPermissions] = useState({});

    // Tüm transfer senaryoları - API'ye göre
    const allTransferTypes = [
        // COMPANY kaynaklı transferler
        {
            value: 'company_to_user_same',
            label: t('transfers:types.company_to_user_same.label'),
            icon: <Person/>,
            fromScope: 'company',
            toScope: 'user',
            permission: 'can_transfer_company_to_same_company_user',
            description: t('transfers:types.company_to_user_same.description'),
            requiresUser: true,
            requiresOtherCompany: false,
        },
        {
            value: 'company_to_user_other',
            label: t('transfers:types.company_to_user_other.label'),
            icon: <Business/>,
            fromScope: 'company',
            toScope: 'user',
            permission: 'can_transfer_company_to_other_company_user',
            description: t('transfers:types.company_to_user_other.description'),
            requiresUser: true,
            requiresOtherCompany: true,
        },
        {
            value: 'company_to_company_other',
            label: t('transfers:types.company_to_company_other.label'),
            icon: <Business/>,
            fromScope: 'company',
            toScope: 'company',
            permission: 'can_transfer_company_to_other_company',
            description: t('transfers:types.company_to_company_other.description'),
            requiresUser: false,
            requiresOtherCompany: true,
        },
        {
            value: 'company_to_external',
            label: t('transfers:types.company_to_external.label'),
            icon: <AccountBalance/>,
            fromScope: 'company',
            toScope: 'external',
            permission: 'can_transfer_company_to_other_company',
            description: t('transfers:types.company_to_external.description'),
            requiresUser: false,
            requiresOtherCompany: false,
            requiresExternal: true,
        },
        // USER kaynaklı transferler
        {
            value: 'user_to_user_same',
            label: t('transfers:types.user_to_user_same.label'),
            icon: <Person/>,
            fromScope: 'user',
            toScope: 'user',
            permission: 'can_transfer_user_to_same_company_user',
            description: t('transfers:types.user_to_user_same.description'),
            requiresUser: true,
            requiresOtherCompany: false,
        },
        {
            value: 'user_to_user_other',
            label: t('transfers:types.user_to_user_other.label'),
            icon: <Business/>,
            fromScope: 'user',
            toScope: 'user',
            permission: 'can_transfer_user_to_other_company_user',
            description: t('transfers:types.user_to_user_other.description'),
            requiresUser: true,
            requiresOtherCompany: true,
        },
        {
            value: 'user_to_company_same',
            label: t('transfers:types.user_to_company_same.label'),
            icon: <TrendingUp/>,
            fromScope: 'user',
            toScope: 'company',
            permission: 'can_transfer_user_to_own_company',
            description: t('transfers:types.user_to_company_same.description'),
            requiresUser: false,
            requiresOtherCompany: false,
        },
        {
            value: 'user_to_company_other',
            label: t('transfers:types.user_to_company_other.label'),
            icon: <SwapHoriz/>,
            fromScope: 'user',
            toScope: 'company',
            permission: 'can_transfer_user_to_other_company',
            description: t('transfers:types.user_to_company_other.description'),
            requiresUser: false,
            requiresOtherCompany: true,
        },
        {
            value: 'user_to_external',
            label: t('transfers:types.user_to_external.label'),
            icon: <AccountBalance/>,
            fromScope: 'user',
            toScope: 'external',
            permission: 'can_transfer_user_to_other_company',
            description: t('transfers:types.user_to_external.description'),
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
        transferType: Yup.string().required(t('transfers:validations.transferTypeRequired')),
        amount: Yup.number()
            .required(t('transfers:validations.amountRequired'))
            .positive(t('transfers:validations.amountPositive'))
            .test('max-decimals', t('transfers:validations.maxDecimals'), function (value) {
                if (!value) return true;
                const decimals = (value.toString().split('.')[1] || '').length;
                return decimals <= 2;
            })
            .test('max-balance', t('transfers:validations.insufficientBalance'), function(value) {
                if (!sourceAccount) return true;
                return value <= sourceAccount.balance;
            }),
        description: Yup.string()
            .max(255, t('transfers:validations.descriptionMax')),
        toUserId: Yup.string().when('transferType', {
            is: (val) => {
                const type = allTransferTypes.find(t => t.value === val);
                return type?.requiresUser;
            },
            then: (schema) => schema.required(t('transfers:validations.selectUser')),
        }),
        toUserCompanyId: Yup.string().when('transferType', {
            is: (val) => {
                const type = allTransferTypes.find(t => t.value === val);
                return type?.requiresOtherCompany;
            },
            then: (schema) => schema.required(t('transfers:validations.companyIdRequired')),
        }),
        toExternalName: Yup.string().when('transferType', {
            is: (val) => {
                const type = allTransferTypes.find(t => t.value === val);
                return type?.requiresExternal;
            },
            then: (schema) => schema.required(t('transfers:validations.externalNameRequired')),
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

        // Eğer başka firma transferi ise ve firma seçiliyse, o firmanın ID'sini kullan
        const currentType = allTransferTypes.find(t => t.value === formik.values.transferType);
        if (currentType?.requiresOtherCompany) {
            if (selectedCompany) {
                // Firma CompanySearchField ile seçildiyse onun ID'sini kullan
                formik.setFieldValue('toUserCompanyId', selectedCompany.id);
            } else if (user.companyId) {
                // Fallback: Kullanıcıdan gelen companyId'yi kullan
                formik.setFieldValue('toUserCompanyId', user.companyId);
            }
        }
    };

    // Firma seçildiğinde
    const handleCompanySelect = (company) => {
        setSelectedCompany(company);
        formik.setFieldValue('toUserCompanyId', company.id);
    };

    // Transfer tipi değiştiğinde seçilen kullanıcıyı ve firmayı temizle
    useEffect(() => {
        setSelectedUser(null);
        setSelectedCompany(null);
        formik.setFieldValue('toUserId', '');
        formik.setFieldValue('toUserCompanyId', '');
        formik.setFieldValue('toExternalName', '');
        // eslint-disable-next-line
    }, [formik.values.transferType]);

    // Firma seçimi temizlendiğinde kullanıcı seçimini de temizle
    useEffect(() => {
        const currentType = allTransferTypes.find(t => t.value === formik.values.transferType);
        if (currentType?.requiresOtherCompany && currentType?.requiresUser && !selectedCompany) {
            setSelectedUser(null);
            formik.setFieldValue('toUserId', '');
        }
        // eslint-disable-next-line
    }, [selectedCompany]);

    const handleTransfer = async (values) => {
        try {
            setLoading(true);

            const transferType = allTransferTypes.find(t => t.value === values.transferType);
            if (!transferType) {
                throw new Error('Unkown transfer type');
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
                showAlert(response.data.message || t('transfers:messages.success'), 'success');
                formik.resetForm();
                setSelectedUser(null);
                onClose();
            } else {
                showAlert(response.data.message || t('transfers:messages.createFailed'), 'error');
            }
        } catch (error) {
            console.error('Transfer hatası:', error);
            if (error.response?.data?.message) {
                showAlert(error.response.data.message, 'error');
            } else if (error.message) {
                showAlert(error.message, 'error');
            } else {
                showAlert(t('transfers:messages.genericError'), 'error');
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
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                    <Send color="primary"/>
                    {t('transfers:title')}
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
                    <Close/>
                </IconButton>
            </DialogTitle>

            <form onSubmit={formik.handleSubmit}>
                <DialogContent sx={{mt: 2}}>
                    {/* Kaynak hesap bilgisi */}
                    {sourceAccount && (
                        <Alert severity="info" sx={{mb: 3, borderRadius: 2}}>
                            <Typography variant="body2" sx={{fontWeight: 600, mb: 0.5}}>
                                {t('transfers:info.sender')}: {fromScope === 'user' ? t('transfers:info.personalAccount') : t('transfers:info.companyAccount')}
                            </Typography>
                            <Typography variant="body2">
                                {t('transfers:info.currentBalance')}: {new Intl.NumberFormat(i18n.language === 'tr' ? 'tr-TR' : i18n.language === 'de' ? 'de-DE' : 'en-US', {
                                style: 'currency',
                                currency: sourceAccount.currency || 'EUR',
                            }).format(sourceAccount.balance)}
                            </Typography>
                        </Alert>
                    )}

                    {/* Transfer tipi seçimi */}
                    <FormControl component="fieldset" fullWidth sx={{mb: 3}}>
                        <FormLabel component="legend" sx={{mb: 2, fontWeight: 600}}>
                            {t('transfers:fields.transferType')}
                        </FormLabel>
                        <RadioGroup
                            name="transferType"
                            value={formik.values.transferType}
                            onChange={formik.handleChange}
                        >
                            {transferTypes.map((type) => (
                                <Box key={type.value} sx={{mb: 1}}>
                                    <FormControlLabel
                                        value={type.value}
                                        disabled={isTransferTypeDisabled(type.value)}
                                        control={<Radio/>}
                                        label={
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                {type.icon}
                                                <Box>
                                                    <Typography variant="body1" sx={{fontWeight: 500}}>
                                                        {type.label}
                                                        {isTransferTypeDisabled(type.value) && (
                                                            <Chip
                                                                label={t('transfers:labels.noPermission')}
                                                                size="small"
                                                                color="error"
                                                                sx={{ml: 1, height: 20}}
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
                            <Typography color="error" variant="caption" sx={{mt: 1}}>
                                {formik.errors.transferType}
                            </Typography>
                        )}
                    </FormControl>

                    {/* Tutar */}
                    <TextField
                        fullWidth
                        label={t('transfers:fields.amount')}
                        name="amount"
                        type="number"
                        inputProps={{step: '0.01', min: '0'}}
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
                        sx={{mb: 3}}
                    />

                    {/* Dinamik alanlar - Transfer tipine göre */}
                    {/* Başka firmadaki kullanıcıya transfer - önce firma seç, sonra kullanıcı */}
                    {currentTransferType?.requiresUser && currentTransferType?.requiresOtherCompany && (
                        <>
                            <Box sx={{mb: 3}}>
                                <Typography variant="subtitle2" sx={{mb: 1, fontWeight: 600}}>
                                    {t('transfers:steps.selectTargetCompany')}
                                </Typography>
                                <CompanySearchField
                                    onCompanySelect={handleCompanySelect}
                                    excludeCompanyId={sourceAccount?.company?.id || sourceAccount?.id}
                                    minWidth="100%"
                                />
                                {formik.touched.toUserCompanyId && formik.errors.toUserCompanyId && (
                                    <Typography color="error" variant="caption" sx={{mt: 0.5, display: 'block'}}>
                                        {formik.errors.toUserCompanyId}
                                    </Typography>
                                )}
                            </Box>

                            {/* Seçilen firma bilgisi */}
                            {selectedCompany && (
                                <Alert severity="info" sx={{mb: 3, borderRadius: 2}}>
                                    <Typography variant="body2" sx={{fontWeight: 600, mb: 0.5}}>
                                        {t('transfers:labels.selectedCompany')}
                                    </Typography>
                                    <Typography variant="body2">
                                        {selectedCompany.company_name}
                                    </Typography>
                                    <Box sx={{display: 'flex', gap: 1, mt: 0.5}}>
                                        <Chip label={selectedCompany.sector} size="small" variant="outlined"/>
                                        <Chip label={selectedCompany.currency} size="small" color="primary"/>
                                    </Box>
                                </Alert>
                            )}

                            {/* Firma seçildikten sonra kullanıcı seçimi */}
                            {selectedCompany && (
                                <Box sx={{mb: 3}}>
                                    <Typography variant="subtitle2" sx={{mb: 1, fontWeight: 600}}>
                                        {t('transfers:steps.selectUserFromCompany')}
                                    </Typography>
                                    <UserSearchField
                                        companyId={selectedCompany.id}
                                        searchScope="company"
                                        onUserSelect={handleUserSelect}
                                        minWidth="100%"
                                    />
                                    {formik.touched.toUserId && formik.errors.toUserId && (
                                        <Typography color="error" variant="caption" sx={{mt: 0.5, display: 'block'}}>
                                            {formik.errors.toUserId}
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* Seçilen kullanıcı bilgisi */}
                            {selectedUser && (
                                <Alert severity="success" sx={{mb: 3, borderRadius: 2}}>
                                    <Typography variant="body2" sx={{fontWeight: 600, mb: 0.5}}>
                                        {t('transfers:labels.selectedUser')}
                                    </Typography>
                                    <Typography variant="body2">
                                        {selectedUser.name} {selectedUser.surname}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedUser.email}
                                    </Typography>
                                </Alert>
                            )}
                        </>
                    )}

                    {/* Aynı firmadaki kullanıcıya transfer */}
                    {currentTransferType?.requiresUser && !currentTransferType?.requiresOtherCompany && (
                        <>
                            <Box sx={{mb: 3}}>
                                <Typography variant="subtitle2" sx={{mb: 1, fontWeight: 600}}>
                                    {t('transfers:fields.receiverUser')}
                                </Typography>
                                <UserSearchField
                                    companyId={sourceAccount?.company?.id || sourceAccount?.id}
                                    searchScope="company"
                                    onUserSelect={handleUserSelect}
                                    minWidth="100%"
                                />
                                {formik.touched.toUserId && formik.errors.toUserId && (
                                    <Typography color="error" variant="caption" sx={{mt: 0.5, display: 'block'}}>
                                        {formik.errors.toUserId}
                                    </Typography>
                                )}
                            </Box>

                            {/* Seçilen kullanıcı bilgisi */}
                            {selectedUser && (
                                <Alert severity="success" sx={{mb: 3, borderRadius: 2}}>
                                    <Typography variant="body2" sx={{fontWeight: 600, mb: 0.5}}>
                                        {t('transfers:labels.selectedUser')}
                                    </Typography>
                                    <Typography variant="body2">
                                        {selectedUser.name} {selectedUser.surname}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedUser.email}
                                    </Typography>
                                </Alert>
                            )}
                        </>
                    )}

                    {currentTransferType?.requiresOtherCompany && !currentTransferType?.requiresUser && (
                        <>
                            <Box sx={{mb: 3}}>
                                <Typography variant="subtitle2" sx={{mb: 1, fontWeight: 600}}>
                                    {t('transfers:fields.targetCompany')}
                                </Typography>
                                <CompanySearchField
                                    onCompanySelect={handleCompanySelect}
                                    excludeCompanyId={sourceAccount?.company?.id || sourceAccount?.id}
                                    minWidth="100%"
                                />
                                {formik.touched.toUserCompanyId && formik.errors.toUserCompanyId && (
                                    <Typography color="error" variant="caption" sx={{mt: 0.5, display: 'block'}}>
                                        {formik.errors.toUserCompanyId}
                                    </Typography>
                                )}
                            </Box>

                            {/* Seçilen firma bilgisi */}
                            {selectedCompany && (
                                <Alert severity="success" sx={{mb: 3, borderRadius: 2}}>
                                    <Typography variant="body2" sx={{fontWeight: 600, mb: 0.5}}>
                                        {t('transfers:labels.selectedCompany')}
                                    </Typography>
                                    <Typography variant="body2">
                                        {selectedCompany.company_name}
                                    </Typography>
                                    <Box sx={{display: 'flex', gap: 1, mt: 0.5}}>
                                        <Chip label={selectedCompany.sector} size="small" variant="outlined"/>
                                        <Chip label={selectedCompany.currency} size="small" color="primary"/>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary"
                                                sx={{display: 'block', mt: 0.5, fontFamily: 'monospace'}}>
                                        {t('transfers:labels.companyId')}: {selectedCompany.id}
                                    </Typography>
                                </Alert>
                            )}
                        </>
                    )}

                    {currentTransferType?.requiresExternal && (
                        <TextField
                            fullWidth
                            label={t('transfers:fields.externalName')}
                            name="toExternalName"
                            value={formik.values.toExternalName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.toExternalName && Boolean(formik.errors.toExternalName)}
                            helperText={formik.touched.toExternalName && formik.errors.toExternalName}
                            placeholder={t('transfers:placeholders.externalName')}
                            sx={{mb: 3}}
                        />
                    )}

                    {/* Açıklama */}
                    <TextField
                        fullWidth
                        label={t('transfers:fields.description')}
                        name="description"
                        multiline
                        rows={3}
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.description && Boolean(formik.errors.description)}
                        helperText={formik.touched.description && formik.errors.description}
                        placeholder={t('transfers:placeholders.description')}
                        inputProps={{maxLength: 255}}
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
                        {t('transfers:actions.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !formik.isValid || !formik.values.transferType}
                        startIcon={loading ? <CircularProgress size={20}/> : <Send/>}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                        }}
                    >
                        {loading ? t('transfers:actions.sending') : t('transfers:actions.send')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
