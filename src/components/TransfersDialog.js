import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Box,
    Typography,
    useMediaQuery,
    useTheme,
    CircularProgress,
    Alert
} from '@mui/material';
import { Close, Person } from '@mui/icons-material';
import axios from 'axios';
import TransfersTable from './TransfersTable';
import {useAuth} from "../contexts/AuthContext";

export default function TransfersDialog({ open, onClose, accountId, userId }) {
    const theme = useTheme();
    const { token } = useAuth();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [accountData, setAccountData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAccountData = async () => {
            if (!accountId || !open) return;

            setLoading(true);
            setError(null);

            try {
                const response = await axios.post(
                    `${process.env.REACT_APP_API_URL}/accounts/get`,
                    { accountId },
                    {
                        headers: {
                            'x-access-token': token,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (response.data.status === "success") {
                    setAccountData({
                        ...response.data.account,
                        company: response.data.company
                    });
                } else {
                    setError(response.data.message || 'Hesap bilgileri alınamadı');
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Hesap bilgileri alınırken bir hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        fetchAccountData();
    }, [accountId, open, token]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={isMobile}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 3,
                    minHeight: isMobile ? '100vh' : '80vh',
                }
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    px: 2,
                    borderBottom: (t) => `1px solid ${t.palette.divider}`,
                    bgcolor: 'background.paper',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {accountData?.name || 'Yükleniyor...'}
                    </Typography>
                    {accountData?.company?.company_name && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            • {accountData.company.company_name}
                        </Typography>
                    )}
                </Box>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{ color: 'text.secondary' }}
                    aria-label="close"
                >
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, bgcolor: 'background.default' }}>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                        <CircularProgress />
                    </Box>
                )}
                {error && (
                    <Box sx={{ p: 3 }}>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                )}
                {!loading && !error && accountData?.company?.id && (
                    <TransfersTable entitySearch={userId} companyId={accountData.company.id} />
                )}
            </DialogContent>
        </Dialog>
    );
}
