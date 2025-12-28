// src/components/MoneyTransferDialog.js
import React, {useEffect, useMemo, useState, useCallback} from 'react';
import axios from 'axios';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    useMediaQuery, useTheme, Box, Stack, Typography,
    TextField, InputAdornment, MenuItem, Button,
    IconButton, Tooltip, Divider, CircularProgress
} from '@mui/material';

import CloseRounded from '@mui/icons-material/CloseRounded';
import Person from '@mui/icons-material/Person';
import Business from '@mui/icons-material/Business';
import AccountBalance from '@mui/icons-material/AccountBalance';
import TrendingUp from '@mui/icons-material/TrendingUp';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import Send from '@mui/icons-material/Send';
import Clear from '@mui/icons-material/Clear';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import AttachFile from '@mui/icons-material/AttachFile';
import CameraAlt from '@mui/icons-material/CameraAlt';
import InsertDriveFile from '@mui/icons-material/InsertDriveFile';
import Image from '@mui/icons-material/Image';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';

import {useTranslation} from 'react-i18next';
import {useAuth} from '../contexts/AuthContext';
import {useAlert} from '../contexts/AlertContext';
import {permissionsService} from '../services/permissionsService';
import UserSearchField from './UserSearchField';
import CompanySearchField from './CompanySearchField';
import Paper from "@mui/material/Paper";

// -----------------------------
// helpers
// -----------------------------
const currencySymbol = (code) => { // TODO: Burası src/constants/currencies.js içinden alınabilir
    switch (code) {
        case 'USD':
            return '$';
        case 'EUR':
            return '€';
        case 'GBP':
            return '£';
        case 'TRY':
            return '₺';
        case 'JPY':
            return '¥';
        case 'CHF':
            return 'CHF';
        default:
            return code || '';
    }
};

const formatAmount = (n) => {
    try {
        return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(n ?? 0);
    } catch {
        return String(n ?? 0);
    }
};

// UI meta (backend ile birebir)
const ALL_TYPES = [
    // COMPANY kaynaklı
    {
        value: 'company_to_user_same',
        labelKey: 'transfers:types.company_to_user_same.label',
        descKey: 'transfers:types.company_to_user_same.description',
        icon: <Person/>,
        fromScope: 'company',
        toScope: 'user',
        permission: 'can_transfer_company_to_same_company_user',
        requiresUser: true,
        requiresOtherCompany: false,
        requiresToExternalName: false,
        requiresFromExternalName: false,
    },
    {
        value: 'company_to_user_other',
        labelKey: 'transfers:types.company_to_user_other.label',
        descKey: 'transfers:types.company_to_user_other.description',
        icon: <Business/>,
        fromScope: 'company',
        toScope: 'user',
        permission: 'can_transfer_company_to_other_company_user',
        requiresUser: true,
        requiresOtherCompany: true,
        requiresToExternalName: false,
        requiresFromExternalName: false,
    },
    {
        value: 'company_to_company_other',
        labelKey: 'transfers:types.company_to_company_other.label',
        descKey: 'transfers:types.company_to_company_other.description',
        icon: <Business/>,
        fromScope: 'company',
        toScope: 'company',
        permission: 'can_transfer_company_to_other_company',
        requiresUser: false,
        requiresOtherCompany: true,
        requiresToExternalName: false,
        requiresFromExternalName: false,
    },
    {
        value: 'company_to_external',
        labelKey: 'transfers:types.company_to_external.label',
        descKey: 'transfers:types.company_to_external.description',
        icon: <AccountBalance/>,
        fromScope: 'company',
        toScope: 'external',
        permission: 'can_transfer_company_to_external',
        requiresUser: false,
        requiresOtherCompany: false,
        requiresToExternalName: true,
        requiresFromExternalName: false,
    },

    // USER kaynaklı
    {
        value: 'user_to_user_same',
        labelKey: 'transfers:types.user_to_user_same.label',
        descKey: 'transfers:types.user_to_user_same.description',
        icon: <Person/>,
        fromScope: 'user',
        toScope: 'user',
        permission: 'can_transfer_user_to_same_company_user',
        requiresUser: true,
        requiresOtherCompany: false,
        requiresToExternalName: false,
        requiresFromExternalName: false,
    },
    {
        value: 'user_to_user_other',
        labelKey: 'transfers:types.user_to_user_other.label',
        descKey: 'transfers:types.user_to_user_other.description',
        icon: <Business/>,
        fromScope: 'user',
        toScope: 'user',
        permission: 'can_transfer_user_to_other_company_user',
        requiresUser: true,
        requiresOtherCompany: true,
        requiresToExternalName: false,
        requiresFromExternalName: false,
    },
    {
        value: 'user_to_company_same',
        labelKey: 'transfers:types.user_to_company_same.label',
        descKey: 'transfers:types.user_to_company_same.description',
        icon: <TrendingUp/>,
        fromScope: 'user',
        toScope: 'company',
        permission: 'can_transfer_user_to_own_company',
        requiresUser: false,
        requiresOtherCompany: false,
        requiresToExternalName: false,
        requiresFromExternalName: false,
    },
    {
        value: 'user_to_company_other',
        labelKey: 'transfers:types.user_to_company_other.label',
        descKey: 'transfers:types.user_to_company_other.description',
        icon: <SwapHoriz/>,
        fromScope: 'user',
        toScope: 'company',
        permission: 'can_transfer_user_to_other_company',
        requiresUser: false,
        requiresOtherCompany: true,
        requiresToExternalName: false,
        requiresFromExternalName: false,
    },
    {
        value: 'user_to_external',
        labelKey: 'transfers:types.user_to_external.label',
        descKey: 'transfers:types.user_to_external.description',
        icon: <AccountBalance/>,
        fromScope: 'user',
        toScope: 'external',
        permission: 'can_transfer_user_to_external',
        requiresUser: false,
        requiresOtherCompany: false,
        requiresToExternalName: true,
        requiresFromExternalName: false,
    },
];

// -----------------------------
// component
// -----------------------------
export default function MoneyTransferDialog({open, onClose, sourceAccount = null, fromScope, handleSuccess}) {
    const {t} = useTranslation(['transfers', 'common']);
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const {token, user} = useAuth();
    const {showError, showSuccess} = useAlert();

    // derived
    const companyId = sourceAccount?.company?.id || sourceAccount?.id || null;
    const currency = sourceAccount?.currency || sourceAccount?.company?.currency || 'EUR';
    const symbol = currencySymbol(currency);

    // state
    const [loadingPerms, setLoadingPerms] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [availableTypes, setAvailableTypes] = useState([]);
    const [typeValue, setTypeValue] = useState('');

    const [toCompany, setToCompany] = useState(null);      // CompanySearchField → object
    const [toUser, setToUser] = useState(null);            // UserSearchField → object
    const [toExternalName, setToExternalName] = useState('');

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [attachedFiles, setAttachedFiles] = useState([]);

    // filtre: bu dialog sadece verilen fromScope için tipleri gösterir
    const scopedTypes = useMemo(
        () => ALL_TYPES.filter((x) => x.fromScope === fromScope),
        [fromScope]
    );

    // izinleri preload et ve uygun tipleri listele
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!open || !token || !user?.id || !companyId) {
                setAvailableTypes([]);
                setTypeValue('');
                return;
            }
            setLoadingPerms(true);
            try {
                const checks = await Promise.all(
                    scopedTypes.map(async (def) => {
                        const ok = await permissionsService.checkUserRoles(token, user, companyId, [def.permission]);
                        return ok ? def : null;
                    })
                );
                const allowed = checks.filter(Boolean);
                if (!cancelled) {
                    setAvailableTypes(allowed);
                    // önceki seçim geçerliyse koru; değilse ilk uygunu seç
                    setTypeValue((prev) => (allowed.some((x) => x.value === prev) ? prev : allowed[0]?.value || ''));
                }
            } catch {
                if (!cancelled) {
                    setAvailableTypes([]);
                    setTypeValue('');
                }
            } finally {
                if (!cancelled) setLoadingPerms(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, token, user, companyId, scopedTypes]);

    // tip değişince bağımlı alanları sıfırla
    useEffect(() => {
        setToCompany(null);
        setToUser(null);
        setToExternalName('');
    }, [typeValue]);

    const selectedType = useMemo(
        () => availableTypes.find((x) => x.value === typeValue) || null,
        [availableTypes, typeValue]
    );

    const handleClose = useCallback(() => {
        if (submitting) return;
        onClose?.();
    }, [onClose, submitting]);

    // seçim handler’ları
    const handleCompanySelect = useCallback((company) => {
        setToCompany(company); // object
        setToUser(null);       // firma değişince kullanıcıyı sıfırla
    }, []);

    const handleUserSelect = useCallback((userObj) => setToUser(userObj), []);

    // dosya yönetimi
    const handleFileSelect = useCallback((event) => {
        const files = Array.from(event.target.files || []);
        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
            if (!isValidType) showError(t('transfers:validations.invalid_file_type'));
            if (!isValidSize) showError(t('transfers:validations.file_too_large'));
            return isValidType && isValidSize;
        });
        setAttachedFiles(prev => [...prev, ...validFiles]);
    }, [showError, t]);

    const handleRemoveFile = useCallback((index) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const getFileIcon = (file) => {
        if (file.type === 'application/pdf') return <PictureAsPdf sx={{color: '#d32f2f'}}/>;
        if (file.type.startsWith('image/')) return <Image sx={{color: '#1976d2'}}/>;
        return <InsertDriveFile/>;
    };

    // doğrulama
    const validate = () => {
        if (!selectedType) {
            showError(t('transfers:validations.select_type'));
            return false;
        }
        const amt = Number(String(amount).replace(',', '.'));
        if (!amount || Number.isNaN(amt) || amt <= 0) {
            showError(t('transfers:validations.amount_positive'));
            return false;
        }
        if (selectedType.requiresOtherCompany && !toCompany?.id) {
            showError(t('transfers:validations.company_required'));
            return false;
        }
        if (selectedType.requiresUser) {
            // other-company ise firma seçmeden user aramasını engelle
            if (selectedType.requiresOtherCompany && !toCompany?.id) {
                showError(t('transfers:validations.select_company_first'));
                return false;
            }
            if (!toUser?.id) {
                showError(t('transfers:validations.user_required'));
                return false;
            }
        }
        if (selectedType.requiresToExternalName && !toExternalName.trim()) {
            showError(t('transfers:validations.to_external_name_required'));
            return false;
        }
        return true;
    };

    // payload oluştur
    const buildRequest = () => {
        const amt = Number(String(amount).replace(',', '.'));
        const formData = new FormData();

        formData.append('transfer_type', selectedType.value);
        formData.append('currency', currency);
        formData.append('amount', amt);
        if (description?.trim()) formData.append('description', description.trim());
        formData.append('from_scope', selectedType.fromScope);
        formData.append('to_scope', selectedType.toScope);
        formData.append('company_id', companyId);

        if (selectedType.requiresUser && toUser?.id) {
            formData.append('to_user_id', toUser.id);
            formData.append('to_user_company_id', selectedType.requiresOtherCompany ? toCompany?.id : companyId);
        } else if (selectedType.requiresOtherCompany && toCompany?.id) {
            formData.append('to_user_company_id', toCompany.id);
        }

        if (selectedType.value === 'user_to_company_same') {
            formData.append('to_user_company_id', companyId);
        }
        if (selectedType.requiresToExternalName) {
            formData.append('to_external_name', toExternalName.trim());
        }

        // dosyaları ekle
        attachedFiles.forEach((file) => {
            formData.append('attachments', file);
        });

        return formData;
    };

    // submit
    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const requestData = buildRequest();
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/transfers/create`,
                requestData,
                {
                    headers: {
                        'x-access-token': token,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (res?.data?.status === 'success') {
                showSuccess(res?.data?.message || t('transfers:create.success'));
                // reset
                setAmount('');
                setDescription('');
                setToCompany(null);
                setToUser(null);
                setToExternalName('');
                setAttachedFiles([]);
                onClose?.(res.data);

                if (typeof handleSuccess === 'function') {
                    handleSuccess();
                }

            } else {
                showError(res?.data?.message || t('transfers:create.failed'));
            }
        } catch (e) {
            const apiMsg = e?.response?.data?.message || e?.message || t('transfers:create.failed');
            showError(apiMsg);
        } finally {
            setSubmitting(false);
        }
    };

    // dinamik alan bayrakları
    const showCompanyField = !!selectedType?.requiresOtherCompany;
    const showUserField = !!selectedType?.requiresUser;
    const showToExternal = !!selectedType?.requiresToExternalName;

    // -----------------------------
    // render
    // -----------------------------
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            fullScreen={fullScreen}
            PaperProps={{sx: {borderRadius: fullScreen ? 0 : 2}}}
        >
            <DialogTitle
                sx={{
                    pr: 6,
                    color: 'white',
                    background: 'linear-gradient(90deg, rgba(99,102,241,0.7), rgba(236,72,153,0.7))',
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    position: 'relative',
                }}
            >
                {t('transfers:dialog.title')}

                <IconButton
                    aria-label={t('common:close')}
                    onClick={handleClose}
                    edge="end"
                    sx={{
                        position: 'absolute',
                        right: 16,
                        top: 8,
                        color: 'white',
                        transition: 'opacity 0.2s ease',
                        '&:hover': {opacity: 0.8},
                    }}
                >
                    <CloseRounded/>
                </IconButton>
            </DialogTitle>


            <DialogContent dividers sx={{pt: 2}}>
                {/* Kaynak Hesap Özeti */}
                <Paper
                    elevation={3}
                    sx={{
                        mb: 3,
                        borderRadius: 3,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: theme.shadows[6],
                        },
                    }}
                >
                    {/* Üst kısım: İkon ve Bilgiler */}
                    <Box sx={{p: 2.5, display: 'flex', alignItems: 'center', gap: 2}}>
                        <Paper
                            elevation={2}
                            sx={{
                                width: 60,
                                height: 60,
                                flexShrink: 0,
                                borderRadius: 2,
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: theme.palette.text.primary,
                                transition: 'all 0.25s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    color: theme.palette.primary.main,
                                    borderColor: theme.palette.primary.main,
                                },
                            }}
                        >
                            {fromScope === 'company' && <Business fontSize="medium"/>}
                            {fromScope === 'user' && <Person fontSize="medium"/>}
                            {fromScope === 'external' && <AccountBalance fontSize="medium"/>}
                        </Paper>

                        <Box sx={{flex: 1, minWidth: 0}}>
                            <Typography
                                variant="overline"
                                sx={{
                                    color: 'text.secondary',
                                    fontSize: '0.75rem',
                                    letterSpacing: 0.5,
                                    textTransform: 'uppercase',
                                    display: 'block',
                                }}
                            >
                                {fromScope === 'company'
                                    ? t('transfers:dialog.source_company')
                                    : t('transfers:dialog.sender_account')}
                            </Typography>

                            {fromScope === 'company' ? (
                                <>
                                    <Typography variant="subtitle1" sx={{fontWeight: 600, mb: 0.25}}>
                                        {sourceAccount?.company_name}
                                    </Typography>
                                    <Typography variant="caption" sx={{color: 'text.secondary'}}>
                                        {t('transfers:labels.companyId')}: {sourceAccount?.id}
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <Typography variant="subtitle1" sx={{fontWeight: 600, mb: 0.25}}>
                                        {sourceAccount?.name || '-'}
                                    </Typography>
                                    {sourceAccount?.company?.company_name && (
                                        <Typography variant="caption" sx={{color: 'text.secondary'}}>
                                            {sourceAccount.company.company_name}
                                        </Typography>
                                    )}
                                </>
                            )}
                        </Box>
                    </Box>

                    {/* Alt kısım: Bakiye (renkli arka plan) */}
                    <Box
                        sx={{
                            px: 2.5,
                            py: 1.75,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}08 100%)`,
                            borderTop: `1px solid ${theme.palette.divider}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                letterSpacing: 0.5,
                            }}
                        >
                            {t('common:balance')}
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                color: 'text.primary',
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 0.5,
                            }}
                        >
                            <Box component="span" sx={{whiteSpace: 'nowrap'}}>
                                {formatAmount(sourceAccount?.balance ?? 0)}
                            </Box>
                            <Typography
                                component="span"
                                variant="subtitle2"
                                sx={{whiteSpace: 'nowrap', fontWeight: 600}}
                            >
                                {sourceAccount?.currency}
                            </Typography>
                        </Typography>
                    </Box>
                </Paper>


                {/* Transfer tipi */}
                <TextField
                    select
                    fullWidth
                    label={t('transfers:fields.transfer_type')}
                    value={typeValue}
                    onChange={(e) => setTypeValue(e.target.value)}
                    disabled={loadingPerms || availableTypes.length === 0}
                    helperText={
                        selectedType
                            ? t(selectedType.descKey)
                            : loadingPerms
                                ? t('transfers:dialog.loading_permissions')
                                : ''
                    }
                    sx={{mb: 2}}
                >
                    {availableTypes.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                                {opt.icon}
                                <span>{t(opt.labelKey)}</span>
                            </Stack>
                        </MenuItem>
                    ))}
                </TextField>

                {/* Hedef firma (gerekiyorsa) */}
                {showCompanyField && (
                    <Box sx={{mb: 2}}>
                        <Typography variant="subtitle2" sx={{mb: 0.5}}>
                            {t('transfers:fields.to_company')}
                        </Typography>

                        {/* Firma seçili DEĞİLSE: arama alanını göster */}
                        {!toCompany && (
                            <CompanySearchField
                                onCompanySelect={handleCompanySelect}
                                excludeCompanyId={sourceAccount?.company?.id || sourceAccount?.id}
                                minWidth="100%"
                            />
                        )}

                        {/* Firma seçiliyse: aramayı gizle, kart göster + çarpı ile temizle */}
                        {toCompany && (
                            <Box
                                sx={{
                                    mt: 1,
                                    p: 1.5,
                                    borderRadius: 1.5,
                                    bgcolor: 'rgba(102,126,234,0.08)',
                                    border: '1px solid rgba(102,126,234,0.25)',
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Business sx={{color: 'primary.main'}} fontSize="small"/>
                                    <Box sx={{flexGrow: 1}}>
                                        <Typography variant="subtitle2" sx={{fontWeight: 600}}>
                                            {toCompany.company_name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {toCompany.currency} • {t('transfers:labels.companyId')}: {toCompany.id}
                                        </Typography>
                                    </Box>
                                    <Tooltip title={t('common:remove')}>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setToCompany(null);
                                                setToUser(null); // firma temizlenince kullanıcıyı da sıfırla
                                            }}
                                        >
                                            <Clear fontSize="small"/>
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Hedef kullanıcı (gerekiyorsa) */}
                {showUserField && (
                    <Box sx={{mb: 2}}>
                        <Typography variant="subtitle2" sx={{mb: 0.5}}>
                            {t('transfers:fields.to_user')}
                        </Typography>

                        {/* Eğer önce firma seçmek gerekiyorsa ve firma seçilmemişse, kilitli uyarı */}
                        {showCompanyField && !toCompany?.id ? (
                            <TextField
                                fullWidth
                                disabled
                                label={t('transfers:fields.to_user')}
                                helperText={t('transfers:validations.select_company_first')}
                            />
                        ) : (
                            <>
                                {/* Kullanıcı seçili DEĞİLSE: arama alanını göster */}
                                {!toUser && (
                                    <UserSearchField
                                        searchScope="company" // ⬅️ senin istediğin zorunlu prop
                                        companyId={
                                            showCompanyField
                                                ? toCompany?.id
                                                : (sourceAccount?.company?.id || sourceAccount?.id)
                                        }
                                        onUserSelect={handleUserSelect}
                                        minWidth="100%"
                                    />
                                )}

                                {/* Kullanıcı seçiliyse: aramayı gizle, kart göster + çarpı ile temizle */}
                                {toUser && (
                                    <Box
                                        sx={{
                                            mt: 1.5,
                                            p: 1.5,
                                            borderRadius: 1.5,
                                            bgcolor: 'rgba(118,75,162,0.08)',
                                            border: '1px solid rgba(118,75,162,0.25)',
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Person sx={{color: 'secondary.main'}} fontSize="small"/>
                                            <Box sx={{flexGrow: 1, minWidth: 0}}>
                                                <Typography variant="subtitle2" sx={{fontWeight: 600}} noWrap>
                                                    {toUser.name} {toUser.surname}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    {toUser.username} • {toUser.email}
                                                </Typography>
                                            </Box>
                                            <Tooltip title={t('common:remove')}>
                                                <IconButton size="small" onClick={() => setToUser(null)}>
                                                    <Clear fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                )}


                {/* External alıcı adı (gerekiyorsa) */}
                {showToExternal && (
                    <TextField
                        fullWidth
                        label={t('transfers:fields.to_external_name')}
                        value={toExternalName}
                        onChange={(e) => setToExternalName(e.target.value)}
                        inputProps={{maxLength: 120}}
                        sx={{mb: 2}}
                    />
                )}

                <Divider sx={{my: 1.5}}/>

                {/* Tutar */}
                <TextField
                    fullWidth
                    label={t('transfers:fields.amount')}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    InputProps={{
                        startAdornment: <InputAdornment position="start">{symbol}</InputAdornment>,
                    }}
                    helperText={`${t('transfers:labels.currency')}: ${currency}`}
                    sx={{mb: 2}}
                />

                {/* Açıklama */}
                <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label={t('transfers:fields.description')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    inputProps={{maxLength: 255}}
                    sx={{mb: 2}}
                />

                {/* Dosya Yükleme */}
                <Box sx={{mb: 2}}>
                    <Typography variant="subtitle2" sx={{mb: 1}}>
                        {t('transfers:fields.attachments')} ({t('common:optional')})
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{mb: 1.5}}>
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<AttachFile/>}
                            size="small"
                        >
                            {t('transfers:buttons.attach_files')}
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
                            startIcon={<CameraAlt/>}
                            size="small"
                            sx={{display: {xs: 'inline-flex', sm: 'none'}}}
                        >
                            {t('transfers:buttons.take_photo')}
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
                                        <Box sx={{flexGrow: 1, minWidth: 0}}>
                                            <Typography variant="body2" noWrap sx={{fontWeight: 500}}>
                                                {file.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </Typography>
                                        </Box>
                                        <Tooltip title={t('common:remove')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveFile(index)}
                                            >
                                                <Clear fontSize="small"/>
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 0.5}}>
                        {t('transfers:hints.file_upload')}
                    </Typography>
                </Box>

                {/* scope info */}
                {selectedType && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{mt: 0.5}}>
                        <InfoOutlined fontSize="small"/>
                        <Typography variant="caption" color="text.secondary">
                            {t('transfers:labels.scopeInfo', {
                                from: t(`transfers:scopes.${selectedType?.fromScope}`),
                                to: t(`transfers:scopes.${selectedType?.toScope}`)
                            })}
                        </Typography>

                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{px: 3, py: 2}}>
                <Button onClick={handleClose} disabled={submitting}>
                    {t('common:cancel')}
                </Button>
                <Box sx={{position: 'relative'}}>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        startIcon={<Send/>}
                        disabled={!typeValue || submitting || loadingPerms}
                    >
                        {submitting ? t('common:please_wait') : t('transfers:dialog.submit')}
                    </Button>
                    {(submitting || loadingPerms) && (
                        <CircularProgress
                            size={24}
                            sx={{position: 'absolute', top: '50%', left: '50%', mt: '-12px', ml: '-12px'}}
                        />
                    )}
                </Box>
            </DialogActions>
        </Dialog>
    );
}
