import React, { useEffect, useState } from 'react';
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
    Close,
    Email,
    Phone,
    Person,
    ExpandMore,
    Security,
    Edit,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { usePermissions } from '../contexts/PermissionsContext';

export default function EditUserPermissionsDialog({ open, onClose, userId, companyId }) {
    const { token } = useAuth();
    const { showAlert } = useAlert();
    const { getPermissionsByCategory, decodePermissions, loading: permissionsLoading } = usePermissions();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [userData, setUserData] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [permissionCategories, setPermissionCategories] = useState({});

    useEffect(() => {
        const categories = getPermissionsByCategory();
        setPermissionCategories(categories);
    }, [getPermissionsByCategory]);

    useEffect(() => {
        if (!open) {
            // Dialog kapandığında state'i temizle
            setUserData(null);
            setSelectedPermissions([]);
            setError('');
            return;
        }

        if (!userId || !companyId) return;

        const fetchUserData = async () => {
            setLoading(true);
            setError('');
            try {
                const body = {
                    companyId,
                    searchTerm: userId,
                    searchScope: 'company',
                    limit: 10,
                    offset: 0,
                    sortBy: 'name',
                    sortOrder: 'ASC',
                };

                const response = await axios.post(
                    `${process.env.REACT_APP_API_URL}/search-users`,
                    body,
                    {
                        headers: {
                            'x-access-token': token,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (response.data?.success && response.data?.data?.users?.length > 0) {
                    const user = response.data.data.users[0];
                    setUserData(user);

                    // Kullanıcının mevcut yetkilerini decode et
                    if (user.permissions && user.permissions.length > 0) {
                        const userPermission = user.permissions.find(
                            (p) => p.companyId === companyId
                        );
                        if (userPermission?.permissions) {
                            const decodedPermissions = await decodePermissions(
                                userPermission.permissions
                            );
                            setSelectedPermissions(decodedPermissions);
                        }
                    }
                } else {
                    setError('Kullanıcı bilgileri alınamadı');
                }
            } catch (error) {
                console.error('User permissions fetch failed:', error);
                setError('Kullanıcı bilgileri yüklenirken hata oluştu');
                showAlert('Kullanıcı bilgileri yüklenirken hata oluştu', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [open, userId, companyId, token, decodePermissions, showAlert]);

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    const handlePermissionToggle = (permissionKey) => {
        setSelectedPermissions((prev) => {
            if (prev.includes(permissionKey)) {
                return prev.filter((p) => p !== permissionKey);
            } else {
                // sys_admin seçilirse tüm yetkileri otomatik seç
                if (permissionKey === 'sys_admin') {
                    const allPermissionKeys = Object.values(permissionCategories)
                        .flat()
                        .map((p) => p.key);
                    return [...new Set([...prev, ...allPermissionKeys])];
                }
                return [...prev, permissionKey];
            }
        });
    };

    const handleCategoryToggle = (permissions) => {
        const permissionKeys = permissions.map((p) => p.key);
        const allSelected = permissionKeys.every((key) =>
            selectedPermissions.includes(key)
        );

        setSelectedPermissions((prev) => {
            if (allSelected) {
                return prev.filter((p) => !permissionKeys.includes(p));
            } else {
                const newPermissions = [...prev];
                permissionKeys.forEach((key) => {
                    if (!newPermissions.includes(key)) {
                        newPermissions.push(key);
                    }
                });
                return newPermissions;
            }
        });
    };

    const handleUpdatePermissions = () => {
        alert('burada istek yollanacak');
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: { borderRadius: isMobile ? 0 : 2 },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Edit color="primary" />
                    <Typography variant="h6">Kullanıcı Yetkilerini Düzenle</Typography>
                </Box>
                <IconButton onClick={handleClose} disabled={loading}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                {loading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 4,
                            gap: 2,
                        }}
                    >
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary">
                            Kullanıcı bilgileri yükleniyor...
                        </Typography>
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                ) : userData ? (
                    <>
                        {/* Kullanıcı Bilgileri Card */}
                        <Box
                            sx={{
                                p: 2,
                                border: '2px solid',
                                borderColor: 'primary.main',
                                borderRadius: 2,
                                bgcolor: 'primary.50',
                                mb: 3,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Security color="primary" />
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    Kullanıcı Bilgileri
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Person fontSize="small" color="action" />
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {userData.name} {userData.surname}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Email fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                        {userData.email}
                                    </Typography>
                                    {userData.emailverified ? (
                                        <Chip size="small" label="Onaylı" color="success" />
                                    ) : (
                                        <Chip size="small" label="Bekliyor" color="warning" />
                                    )}
                                </Box>

                                {userData.phone && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Phone fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            {userData.phone}
                                        </Typography>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Kullanıcı Adı:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                        {userData.username}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Yetki Seçimi */}
                        <Paper
                            elevation={0}
                            sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Security color="primary" />
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    Yetki Düzenleme
                                </Typography>
                                <Chip
                                    size="small"
                                    label={`${selectedPermissions.length} seçili`}
                                    color={selectedPermissions.length > 0 ? 'primary' : 'default'}
                                />
                            </Box>

                            {permissionsLoading ? (
                                <Box
                                    sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}
                                >
                                    <CircularProgress size={20} />
                                    <Typography variant="body2" color="text.secondary">
                                        Yetkiler yükleniyor...
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    {Object.keys(permissionCategories).length === 0 ? (
                                        <Alert severity="info" sx={{ mt: 2 }}>
                                            Yetki kategorisi bulunamadı.
                                        </Alert>
                                    ) : (
                                        Object.entries(permissionCategories).map(
                                            ([categoryName, permissions], index) => {
                                                const categoryColors = [
                                                    'primary',
                                                    'secondary',
                                                    'success',
                                                    'warning',
                                                    'info',
                                                    'error',
                                                ];
                                                const categoryColor =
                                                    categoryColors[index % categoryColors.length];

                                                const selectedCount = permissions.filter((p) =>
                                                    selectedPermissions.includes(p.key)
                                                ).length;

                                                const permissionKeys = permissions.map((p) => p.key);
                                                const allSelected = permissionKeys.every((key) =>
                                                    selectedPermissions.includes(key)
                                                );
                                                const someSelected = selectedCount > 0 && !allSelected;

                                                return (
                                                    <Accordion
                                                        key={categoryName}
                                                        defaultExpanded={index === 0}
                                                    >
                                                        <AccordionSummary
                                                            expandIcon={<ExpandMore />}
                                                            sx={{
                                                                '& .MuiAccordionSummary-content': {
                                                                    alignItems: 'center',
                                                                    gap: 1,
                                                                },
                                                            }}
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
                                                            />
                                                            <Typography
                                                                variant="subtitle2"
                                                                sx={{ fontWeight: 600 }}
                                                            >
                                                                {categoryName}
                                                            </Typography>
                                                            <Chip
                                                                size="small"
                                                                label={`${selectedCount}/${permissions.length}`}
                                                                sx={{ ml: 'auto' }}
                                                                color={
                                                                    selectedCount > 0
                                                                        ? categoryColor
                                                                        : 'default'
                                                                }
                                                                variant={
                                                                    selectedCount > 0
                                                                        ? 'filled'
                                                                        : 'outlined'
                                                                }
                                                            />
                                                        </AccordionSummary>
                                                        <AccordionDetails>
                                                            <FormGroup>
                                                                {permissions.map((permission) => (
                                                                    <FormControlLabel
                                                                        key={permission.key}
                                                                        control={
                                                                            <Checkbox
                                                                                checked={selectedPermissions.includes(
                                                                                    permission.key
                                                                                )}
                                                                                onChange={() =>
                                                                                    handlePermissionToggle(
                                                                                        permission.key
                                                                                    )
                                                                                }
                                                                                size="small"
                                                                            />
                                                                        }
                                                                        label={
                                                                            <Box sx={{ ml: 1 }}>
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{ fontWeight: 600 }}
                                                                                >
                                                                                    {permission.name}
                                                                                </Typography>
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    color="text.secondary"
                                                                                    sx={{ display: 'block' }}
                                                                                >
                                                                                    {permission.description}
                                                                                </Typography>
                                                                                <Chip
                                                                                    size="small"
                                                                                    label={`Kod: ${permission.code}`}
                                                                                    sx={{
                                                                                        mt: 0.5,
                                                                                        height: 20,
                                                                                        fontSize: '0.7rem',
                                                                                    }}
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
                                                                            '&:hover': {
                                                                                bgcolor: 'action.hover',
                                                                            },
                                                                        }}
                                                                    />
                                                                ))}
                                                            </FormGroup>
                                                        </AccordionDetails>
                                                    </Accordion>
                                                );
                                            }
                                        )
                                    )}
                                </>
                            )}
                        </Paper>
                    </>
                ) : null}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} disabled={loading}>
                    İptal
                </Button>
                <Button
                    onClick={handleUpdatePermissions}
                    variant="contained"
                    disabled={!userData || selectedPermissions.length === 0 || loading}
                    startIcon={<Edit />}
                >
                    Yetkileri Güncelle
                </Button>
            </DialogActions>
        </Dialog>
    );
}