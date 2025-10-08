// src/components/AddUserToCompany.jsx
import React, { useState } from 'react';
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
} from '@mui/material';
import { PersonAdd, Close, CheckCircle, Email, Phone, Person } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import UserSearchField from './UserSearchField';

export default function AddUserToCompany({ companyId, onUserAdded }) {
    const { token } = useAuth();
    const { showAlert } = useAlert();
    const API_URL = `${process.env.REACT_APP_API_URL}/companies/add-user`;

    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleOpen = () => {
        setOpen(true);
        setSelectedUser(null);
        setError('');
    };

    const handleClose = () => {
        if (!loading) {
            setOpen(false);
            setSelectedUser(null);
            setError('');
        }
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setError('');
    };

    const handleAddUser = async () => {
        if (!selectedUser) {
            setError('Lütfen bir kullanıcı seçin');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await axios.post(
                API_URL,
                {
                    companyId,
                    userId: selectedUser.id,
                },
                {
                    headers: {
                        'x-access-token': token,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.success) {
                showAlert('Kullanıcı başarıyla şirkete eklendi', 'success');
                handleClose();
                if (onUserAdded) {
                    onUserAdded(selectedUser);
                }
            } else {
                setError(response.data.message || 'Kullanıcı eklenirken hata oluştu');
            }
        } catch (err) {
            console.error('Kullanıcı ekleme hatası:', err);
            const errorMsg = err?.response?.data?.message || err.message || 'Beklenmeyen bir hata oluştu';
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
                PaperProps={{
                    sx: { borderRadius: 2 }
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
                </DialogContent>

                <Divider />

                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        İptal
                    </Button>
                    <Button
                        onClick={handleAddUser}
                        variant="contained"
                        disabled={!selectedUser || loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <PersonAdd />}
                    >
                        {loading ? 'Ekleniyor...' : 'Kullanıcıyı Ekle'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
