import React, {useState, useEffect} from 'react';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    Stack,
    IconButton,
    Menu,
    MenuItem
} from '@mui/material';
import {
    AccountBalance,
    Business,
    CalendarToday,
    TrendingUp,
    Person,
    MoreVert
} from '@mui/icons-material';
import axios from 'axios';
import {useAuth} from '../contexts/AuthContext';
import MoneyTransferDialog from './MoneyTransferDialog';
import ExternalMoneyDialog from './ExternalMoneyDialog';

export default function AccountList() {
    const {token} = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [externalMoneyDialogOpen, setExternalMoneyDialogOpen] = useState(false);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/accounts`,
                    {
                        headers: {
                            'x-access-token': token
                        }
                    }
                );

                if (response.data.status === 'success') {
                    setAccounts(response.data.accounts);
                    if (response.data.user?.name && response.data.user?.surname) {
                        setUserName(`${response.data.user.name} ${response.data.user.surname}`);
                    }
                }
            } catch (err) {
                console.error('Hesap listesi yüklenirken hata:', err);
                if (err.response) {
                    setError(err.response.data.message || 'Hesaplar yüklenirken bir hata oluştu');
                } else if (err.request) {
                    setError('Sunucuya ulaşılamıyor');
                } else {
                    setError('Beklenmeyen bir hata oluştu');
                }
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchAccounts();
        }
    }, [token]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatBalance = (balance, currency) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency || 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(balance);
    };

    const handleMenuOpen = (event, account) => {
        setAnchorEl(event.currentTarget);
        setSelectedAccount(account);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleTransferClick = () => {
        handleMenuClose();
        setTransferDialogOpen(true);
    };

    const handleTransferDialogClose = () => {
        setTransferDialogOpen(false);
        setSelectedAccount(null);
    };

    const handleExternalMoneyClick = () => {
        handleMenuClose();
        setExternalMoneyDialogOpen(true);
    };

    const handleExternalMoneyDialogClose = () => {
        setExternalMoneyDialogOpen(false);
        setSelectedAccount(null);
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{mt: 4}}>
                <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
                    <CircularProgress size={60}/>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{mt: 4}}>
                <Alert severity="error" sx={{borderRadius: 2}}>{error}</Alert>
            </Container>
        );
    }

    if (accounts.length === 0) {
        return (
            <Container maxWidth="lg" sx={{mt: 4}}>
                <Alert severity="info" sx={{borderRadius: 2}}>
                    Henüz hesabınız bulunmamaktadır.
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{mt: 4, mb: 4}}>
            <Box sx={{mb: 4}}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontWeight: 700,
                        color: 'text.primary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                    }}
                >
                    <AccountBalance sx={{fontSize: 40, color: 'primary.main'}}/>
                    Hesaplarım
                </Typography>
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        lg: 'repeat(3, 1fr)'
                    },
                    gap: 3
                }}
            >
                {accounts.map((account) => (
                    <Card
                        key={account.id}
                        elevation={2}
                        sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            position: 'relative',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': { transform: 'translateY(-6px)', boxShadow: 6 },
                            // İnce üst şerit (ribbon)
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                height: 4,
                                background:
                                    'linear-gradient(90deg, rgba(99,102,241,0.8), rgba(236,72,153,0.8))',
                            },
                        }}
                    >
                        <CardContent sx={{ pt: 3.5, pb: 2, px: 3 }}>
                            {/* Başlık: avatar yerine ikon + title/subheader */}
                            <Box sx={{ position: 'relative' }}>
                                <IconButton
                                    onClick={(e) => handleMenuOpen(e, account)}
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        top: -4,
                                        right: -4,
                                        color: 'text.secondary',
                                        '&:hover': { color: 'primary.main', backgroundColor: 'action.hover' },
                                    }}
                                >
                                    <MoreVert />
                                </IconButton>

                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Person sx={{ fontSize: 28, color: 'primary.main' }} />

                                    <Box>
                                        {/* Kullanıcı adı */}
                                        {userName && (
                                            <Typography
                                                variant="subtitle1"
                                                sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.1 }}
                                            >
                                                {userName}
                                            </Typography>
                                        )}

                                        {/* Firma adı (userName altı) */}
                                        <Typography
                                            variant="body2"
                                            sx={{ color: 'text.secondary', mt: 0.35 }}
                                        >
                                            {account.company?.company_name}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            {/* Meta satırı */}
                            <Box
                                sx={{
                                    mt: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Chip
                                    label={account.currency}
                                    size="small"
                                    color="primary"
                                    sx={{ fontWeight: 600 }}
                                />

                                <TrendingUp sx={{ color: 'success.main', fontSize: 26 }} />
                            </Box>

                            {/* Bakiye */}
                            <Box sx={{ mt: 1.5 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 0.5, fontWeight: 500 }}
                                >
                                    Bakiye
                                </Typography>
                                <Typography
                                    variant="h4"
                                    sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '-0.5px' }}
                                >
                                    {formatBalance(account.balance, account.currency)}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Firma bloğu (pill) */}
                            {account.company && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.25,
                                        px: 1.25,
                                        py: 1,
                                        borderRadius: 99,
                                        backgroundColor: 'action.hover',
                                    }}
                                >
                                    <Business sx={{ fontSize: 20, color: 'primary.main', opacity: 0.9 }} />

                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 600, color: 'text.primary' }}
                                    >
                                        {account.company.company_name}
                                    </Typography>

                                    {/* Sektör: varsa, çok düşük vurgu ile */}
                                    {account.company?.sector && (
                                        <Chip
                                            label={account.company.sector}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                ml: 'auto',
                                                fontSize: '0.72rem',
                                                height: 24,
                                                color: 'text.secondary',
                                                borderColor: (t) => t.palette.divider,
                                                opacity: 0.55, // dikkat çekmesin
                                            }}
                                        />
                                    )}
                                </Box>
                            )}

                            {/* Kayıt tarihi */}
                            <Box sx={{ mt: 1.5 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">
                                        Kayıt Tarihi: {formatDate(account.created_at)}
                                    </Typography>
                                </Stack>
                            </Box>
                        </CardContent>
                    </Card>

                ))}
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={handleTransferClick}>
                    Para Transferi
                </MenuItem>
                <MenuItem onClick={handleExternalMoneyClick}>
                    Gelir Ekle
                </MenuItem>
            </Menu>

            <MoneyTransferDialog
                open={transferDialogOpen}
                onClose={handleTransferDialogClose}
                sourceAccount={selectedAccount}
                fromScope="user"
            />

            <ExternalMoneyDialog
                open={externalMoneyDialogOpen}
                onClose={handleExternalMoneyDialogClose}
                targetAccount={selectedAccount}
                targetScope="user"
            />
        </Container>
    );
}
