import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Divider,
    IconButton,
    Alert,
    CircularProgress,
    Chip,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    PersonAdd,
    Close,
    CheckCircle,
    Email,
    Phone,
    Person,
    ExpandMore,
    Security,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { usePermissions } from '../contexts/PermissionsContext';
import UserSearchField from './UserSearchField';
import { useTranslation } from 'react-i18next';

export default function AddUserDialog({
                                          open,
                                          onClose,
                                          companyId,
                                          onUserAdded,
                                      }) {
    const { t } = useTranslation(['companyUsers']);
    const { token } = useAuth();
    const { showAlert, showSuccess } = useAlert();
    const { getPermissionsByCategory, encodePermissions, loading: permissionsLoading } = usePermissions();

    const API_URL = `${process.env.REACT_APP_API_URL}/companies/add-user`;

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [permissionCategories, setPermissionCategories] = useState({});

    // Dialog açıldığında izin kategorilerini tazele
    useEffect(() => {
        if (!open) return;
        const categories = getPermissionsByCategory();
        setPermissionCategories(categories);
        setSelectedUser(null);
        setSelectedPermissions([]);
        setError('');
    }, [open, getPermissionsByCategory]);

    const allPermissionKeys = useMemo(() => {
        return Object.values(permissionCategories).flat().map((p) => p.key);
    }, [permissionCategories]);

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setError('');
    };

    const handlePermissionToggle = (permissionKey) => {
        setSelectedPermissions((prev) => {
            if (prev.includes(permissionKey)) {
                return prev.filter((p) => p !== permissionKey);
            }
            // sys_admin seçilirse tüm yetkileri otomatik seç
            if (permissionKey === 'sys_admin') {
                return [...new Set([...prev, ...allPermissionKeys])];
            }
            return [...prev, permissionKey];
        });
    };

    const handleCategoryToggle = (permissions) => {
        const keys = permissions.map((p) => p.key);
        const allSelected = keys.every((k) => selectedPermissions.includes(k));

        setSelectedPermissions((prev) => {
            if (allSelected) {
                // Tümü seçiliyse, bu kategorinin tüm yetkilerini kaldır
                return prev.filter((p) => !keys.includes(p));
            }
            // Tümü seçili değilse, bu kategorinin tüm yetkilerini ekle
            const next = new Set(prev);
            keys.forEach((k) => next.add(k));
            return Array.from(next);
        });
    };

    const handleAddUser = async () => {
        if (!selectedUser) {
            setError(t('companyUsers:errors.selectUser'));
            return;
        }
        if (selectedPermissions.length === 0) {
            setError(t('companyUsers:errors.selectAtLeastOnePermission'));
            return;
        }

        try {
            setLoading(true);
            setError('');

            const permissionsString = await encodePermissions(selectedPermissions);
            const response = await axios.post(
                API_URL,
                {
                    companyId,
                    userId: selectedUser.id,
                    permissions: permissionsString,
                },
                {
                    headers: {
                        'x-access-token': token,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data && response.data.status === 'success') {
                const successMessage =
                    response.data.message || t('companyUsers:messages.addSuccess');
                showSuccess(successMessage, t('companyUsers:messages.successTitle'));

                // Temizle ve kapat
                setSelectedUser(null);
                setSelectedPermissions([]);
                setError('');
                onClose?.();

                if (typeof onUserAdded === 'function') onUserAdded();
            } else {
                const errorMessage =
                    response.data?.message || t('companyUsers:errors.addFailed');
                setError(errorMessage);
                showAlert(errorMessage, 'error');
            }
        } catch (err) {
            console.error(t('companyUsers:errors.consoleAddError'), err);
            let errorMsg;

            if (err.response) {
                const status = err.response.status;
                const responseMessage = err.response.data?.message;
                switch (status) {
                    case 400:
                        errorMsg = responseMessage || t('companyUsers:errors.badRequest');
                        break;
                    case 403:
                        errorMsg = responseMessage || t('companyUsers:errors.forbidden');
                        break;
                    case 404:
                        errorMsg = responseMessage || t('companyUsers:errors.notFound');
                        break;
                    case 500:
                        errorMsg = responseMessage || t('companyUsers:errors.server');
                        break;
                    default:
                        errorMsg =
                            responseMessage ||
                            t('companyUsers:errors.httpWithCode', { status });
                }
            } else if (err.request) {
                errorMsg = t('companyUsers:errors.noResponse');
            } else {
                errorMsg = err.message || t('companyUsers:errors.unexpected');
            }

            setError(errorMsg);
            showAlert(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        onClose?.();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2 } }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonAdd color="primary" />
                    <Typography variant="h6">{t('companyUsers:dialog.title')}</Typography>
                </Box>
                <IconButton onClick={handleClose} disabled={loading} aria-label={t('companyUsers:aria.close')}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('companyUsers:dialog.searchHint')}
                    </Typography>
                    <UserSearchField companyId={companyId} onUserSelect={handleUserSelect} minWidth="100%" />
                </Box>

                {selectedUser && (
                    <Box
                        sx={{
                            p: 2,
                            border: '2px solid',
                            borderColor: 'primary.main',
                            borderRadius: 2,
                            bgcolor: 'primary.50',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <CheckCircle color="success" />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {t('companyUsers:selectedUser.title')}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person fontSize="small" color="action" />
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {selectedUser.name} {selectedUser.surname}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Email fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                    {selectedUser.email}
                                </Typography>
                                {selectedUser.emailverified ? (
                                    <Chip size="small" label={t('companyUsers:labels.verified')} color="success" />
                                ) : (
                                    <Chip size="small" label={t('companyUsers:labels.pending')} color="warning" />
                                )}
                            </Box>

                            {selectedUser.phone && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Phone fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedUser.phone}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {t('companyUsers:labels.username')}
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                    {selectedUser.username}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )}

                {selectedUser && (
                    <Box sx={{ mt: 3 }}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Security color="primary" />
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {t('companyUsers:permissions.title')}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={t('companyUsers:permissions.selectedCount', { count: selectedPermissions.length })}
                                    color={selectedPermissions.length > 0 ? 'primary' : 'default'}
                                />
                            </Box>

                            {permissionsLoading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                                    <CircularProgress size={20} />
                                    <Typography variant="body2" color="text.secondary">
                                        {t('companyUsers:permissions.loading')}
                                    </Typography>
                                </Box>
                            ) : Object.keys(permissionCategories).length === 0 ? (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    {t('companyUsers:permissions.noCategory')}
                                </Alert>
                            ) : (
                                Object.entries(permissionCategories).map(([categoryName, permissions], index) => {
                                    const selectedCount = permissions.filter((p) =>
                                        selectedPermissions.includes(p.key)
                                    ).length;
                                    const permissionKeys = permissions.map((p) => p.key);
                                    const allSelected = permissionKeys.every((k) =>
                                        selectedPermissions.includes(k)
                                    );
                                    const someSelected = selectedCount > 0 && !allSelected;

                                    return (
                                        <Accordion key={categoryName} defaultExpanded={index === 0}>
                                            <AccordionSummary
                                                expandIcon={<ExpandMore />}
                                                sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1 } }}
                                            >
                                                <Checkbox
                                                    checked={allSelected}
                                                    indeterminate={someSelected}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleCategoryToggle(permissions);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    size="small"
                                                    sx={{ p: 0, mr: 1 }}
                                                    inputProps={{ 'aria-label': t('companyUsers:aria.toggleCategory', { category: categoryName }) }}
                                                />
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {categoryName}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={`${selectedCount}/${permissions.length}`}
                                                    sx={{ ml: 'auto' }}
                                                    color={selectedCount > 0 ? 'primary' : 'default'}
                                                    variant={selectedCount > 0 ? 'filled' : 'outlined'}
                                                />
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <FormGroup>
                                                    {permissions.map((permission) => (
                                                        <FormControlLabel
                                                            key={permission.key}
                                                            control={
                                                                <Checkbox
                                                                    checked={selectedPermissions.includes(permission.key)}
                                                                    onChange={() => handlePermissionToggle(permission.key)}
                                                                    size="small"
                                                                />
                                                            }
                                                            label={
                                                                <Box sx={{ ml: 1 }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                        {permission.name}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                                        {permission.description}
                                                                    </Typography>
                                                                    <Chip
                                                                        size="small"
                                                                        label={t('companyUsers:permissions.code', { code: permission.code })}
                                                                        sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                                                                        variant="outlined"
                                                                    />
                                                                </Box>
                                                            }
                                                            sx={{
                                                                alignItems: 'flex-start',
                                                                mb: 2,
                                                                py: 1,
                                                                px: 1,
                                                                borderRadius: 1,
                                                                '&:hover': { bgcolor: 'action.hover' },
                                                            }}
                                                        />
                                                    ))}
                                                </FormGroup>
                                            </AccordionDetails>
                                        </Accordion>
                                    );
                                })
                            )}
                        </Paper>
                    </Box>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} disabled={loading}>
                    {t('companyUsers:actions.cancel')}
                </Button>
                <Button
                    onClick={handleAddUser}
                    variant="contained"
                    disabled={!selectedUser || selectedPermissions.length === 0 || loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <PersonAdd />}
                >
                    {loading ? t('companyUsers:actions.adding') : t('companyUsers:actions.addUser')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
