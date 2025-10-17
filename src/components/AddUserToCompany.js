// src/components/AddUserToCompany.jsx
import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {
    Box,
    Card,
    CardHeader,
    CardContent,
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
    Avatar,
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
import { PersonAdd, Close, CheckCircle, Email, Phone, Person, ExpandMore, Security } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { usePermissions } from '../contexts/PermissionsContext';
import UserSearchField from './UserSearchField';

export default function AddUserToCompany({ companyId, onUserAdded }) {
    const { token } = useAuth();
    const { showAlert,showSuccess } = useAlert();
    const { getPermissionsByCategory, encodePermissions, loading: permissionsLoading } = usePermissions();
    const API_URL = `${process.env.REACT_APP_API_URL}/companies/add-user`;

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [permissionCategories, setPermissionCategories] = useState({});

    useEffect(() => {
        const categories = getPermissionsByCategory();
        setPermissionCategories(categories);
    }, [getPermissionsByCategory]);

    const handleOpen = () => {
        setOpen(true);
        setSelectedUser(null);
        setSelectedPermissions([]);
        setError('');
    };

    const handleClose = () => {
        if (!loading) {
            setOpen(false);
            setSelectedUser(null);
            setSelectedPermissions([]);
            setError('');
        }
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setError('');
    };

    const handlePermissionToggle = (permissionKey) => {
        setSelectedPermissions(prev => {
            if (prev.includes(permissionKey)) {
                return prev.filter(p => p !== permissionKey);
            } else {
                return [...prev, permissionKey];
            }
        });
    };

    const handleCategoryToggle = (permissions) => {
        const permissionKeys = permissions.map(p => p.key);
        const allSelected = permissionKeys.every(key => selectedPermissions.includes(key));

        setSelectedPermissions(prev => {
            if (allSelected) {
                // Tümü seçiliyse, bu kategorinin tüm yetkilerini kaldır
                return prev.filter(p => !permissionKeys.includes(p));
            } else {
                // Tümü seçili değilse, bu kategorinin tüm yetkilerini ekle
                const newPermissions = [...prev];
                permissionKeys.forEach(key => {
                    if (!newPermissions.includes(key)) {
                        newPermissions.push(key);
                    }
                });
                return newPermissions;
            }
        });
    };

    const handleAddUser = async () => {
        if (!selectedUser) {
            setError('Lütfen bir kullanıcı seçin');
            return;
        }

        if (selectedPermissions.length === 0) {
            setError('Lütfen en az bir yetki seçin');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Yetkileri encode et
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

            // API dökümanına göre başarılı yanıt kontrolü
            if (response.data && response.data.status === "success") {
                // API'den dönen mesajı kullan
                const successMessage = response.data.message || 'Kullanıcı başarıyla firmaya eklendi';
                showSuccess(successMessage, 'İşlem Başarılı');

                // Dialog'u kapat ve state'i temizle
                setOpen(false);
                setSelectedUser(null);
                setSelectedPermissions([]);
                setError('');

                // Kullanıcı listesini yenile
                if (onUserAdded && typeof onUserAdded === 'function') {
                    onUserAdded();
                }

            } else {
                // success: false durumu
                const errorMessage = response.data?.message || 'Kullanıcı eklenirken hata oluştu';
                setError(errorMessage);
                showAlert(errorMessage, 'error');
            }
        } catch (err) {
            console.error('Kullanıcı ekleme hatası:', err);
            // TODO: Dil yapılandırılmasını düzeltirken burayı temizle
            // HTTP hata kodlarına göre mesaj belirleme
            let errorMsg = 'Beklenmeyen bir hata oluştu';

            if (err.response) {
                // Sunucudan yanıt geldi ama hata kodu döndü
                const status = err.response.status;
                const responseMessage = err.response.data?.message;

                switch (status) {
                    case 400:
                        // Gerekli alanlar eksik veya kullanıcı zaten firmada mevcut
                        errorMsg = responseMessage || 'Geçersiz istek. Lütfen bilgileri kontrol edin.';
                        break;
                    case 403:
                        // Yetkisiz erişim
                        errorMsg = responseMessage || 'Bu işlem için yetkiniz bulunmamaktadır';
                        break;
                    case 404:
                        // Kullanıcı veya firma bulunamadı
                        errorMsg = responseMessage || 'Kullanıcı veya firma bulunamadı';
                        break;
                    case 500:
                        // Sunucu hatası
                        errorMsg = responseMessage || 'Sunucu hatası oluştu';
                        break;
                    default:
                        errorMsg = responseMessage || `Hata oluştu (${status})`;
                }
            } else if (err.request) {
                // İstek gönderildi ama yanıt alınamadı
                errorMsg = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
            } else {
                // İstek oluşturulurken hata oluştu
                errorMsg = err.message || 'Beklenmeyen bir hata oluştu';
            }

            setError(errorMsg);
            showAlert(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader
                    title="Kullanıcı Ekle"
                    subheader="Şirkete yeni kullanıcı ekleyin"
                    avatar={
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PersonAdd />
                        </Avatar>
                    }
                />
                <CardContent>
                    <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={handleOpen}
                        fullWidth
                        size="large"
                    >
                        Kullanıcı Ara ve Ekle
                    </Button>
                </CardContent>
            </Card>

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: { borderRadius: isMobile ? 0 : 2 }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonAdd color="primary" />
                        <Typography variant="h6">Şirkete Kullanıcı Ekle</Typography>
                    </Box>
                    <IconButton onClick={handleClose} disabled={loading}>
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
                            Kullanıcı aramak için ad, soyad, e-posta, telefon veya kullanıcı adı girebilirsiniz.
                        </Typography>
                        <UserSearchField
                            companyId={companyId}
                            onUserSelect={handleUserSelect}
                            minWidth="100%"
                        />
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
                                    Seçilen Kullanıcı
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
                                        <Chip size="small" label="Onaylı" color="success" />
                                    ) : (
                                        <Chip size="small" label="Bekliyor" color="warning" />
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
                                        Kullanıcı Adı:
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
                                        Yetki Seçimi
                                    </Typography>
                                    <Chip 
                                        size="small" 
                                        label={`${selectedPermissions.length} seçili`}
                                        color={selectedPermissions.length > 0 ? 'primary' : 'default'}
                                    />
                                </Box>

                                {permissionsLoading ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
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
                                            Object.entries(permissionCategories).map(([categoryName, permissions], index) => {
                                                const categoryColors = ['primary', 'secondary', 'success', 'warning', 'info', 'error'];
                                                const categoryColor = categoryColors[index % categoryColors.length];

                                                const selectedCount = permissions.filter(p => 
                                                    selectedPermissions.includes(p.key)
                                                ).length;

                                                const permissionKeys = permissions.map(p => p.key);
                                                const allSelected = permissionKeys.every(key => 
                                                    selectedPermissions.includes(key)
                                                );
                                                const someSelected = selectedCount > 0 && !allSelected;

                                                return (
                                                    <Accordion key={categoryName} defaultExpanded={index === 0}>
                                                        <AccordionSummary 
                                                            expandIcon={<ExpandMore />}
                                                            sx={{ 
                                                                '& .MuiAccordionSummary-content': { 
                                                                    alignItems: 'center',
                                                                    gap: 1
                                                                } 
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
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                {categoryName}
                                                            </Typography>
                                                            <Chip 
                                                                size="small" 
                                                                label={`${selectedCount}/${permissions.length}`}
                                                                sx={{ ml: 'auto' }}
                                                                color={selectedCount > 0 ? categoryColor : 'default'}
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
                                                                                    label={`Kod: ${permission.code}`}
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
                                                                            '&:hover': {
                                                                                bgcolor: 'action.hover'
                                                                            }
                                                                        }}
                                                                    />
                                                                ))}
                                                            </FormGroup>
                                                        </AccordionDetails>
                                                    </Accordion>
                                                );
                                            })
                                        )}
                                    </>
                                )}
                            </Paper>
                        </Box>
                    )}
                </DialogContent>

                <Divider />

                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        İptal
                    </Button>
                    <Button
                        onClick={handleAddUser}
                        variant="contained"
                        disabled={!selectedUser || selectedPermissions.length === 0 || loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <PersonAdd />}
                    >
                        {loading ? 'Ekleniyor...' : 'Kullanıcıyı Ekle'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
