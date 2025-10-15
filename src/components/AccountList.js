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
                        sx={{
                            borderRadius: 3,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: 6
                            },
                            position: 'relative',
                            overflow: 'visible'
                        }}
                        elevation={2}
                    >
                        <CardContent sx={{p: 3}}>
                            <Box sx={{position: 'absolute', top: 8, right: 8}}>
                                <IconButton
                                    onClick={(e) => handleMenuOpen(e, account)}
                                    size="small"
                                    sx={{
                                        color: 'text.secondary',
                                        '&:hover': {
                                            color: 'primary.main',
                                            backgroundColor: 'action.hover'
                                        }
                                    }}
                                >
                                    <MoreVert />
                                </IconButton>
                            </Box>
                            <Stack spacing={2.5}>
                                {userName && (
                                    <Box>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Person sx={{fontSize: 20, color: 'primary.main'}}/>
                                            <Typography variant="subtitle1" sx={{fontWeight: 600, color: 'text.primary'}}>
                                                {userName}
                                            </Typography>
                                        </Stack>
                                        <Divider sx={{mt: 1.5}}/>
                                    </Box>
                                )}
                                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                    <Chip
                                        label={account.currency}
                                        size="small"
                                        color="primary"
                                        sx={{fontWeight: 600}}
                                    />
                                    <TrendingUp sx={{color: 'success.main', fontSize: 28}}/>
                                </Box>

                                <Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{mb: 0.5, fontWeight: 500}}
                                    >
                                        Bakiye
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 700,
                                            color: 'primary.main',
                                            letterSpacing: '-0.5px'
                                        }}
                                    >
                                        {formatBalance(account.balance, account.currency)}
                                    </Typography>
                                </Box>

                                <Divider/>

                                {account.company && (
                                    <>
                                        <Box>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{mb: 1}}>
                                                <Business sx={{fontSize: 18, color: 'text.secondary'}}/>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{fontWeight: 500}}
                                                >
                                                    Firma Bilgileri
                                                </Typography>
                                            </Stack>
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: 'text.primary',
                                                    mb: 0.5
                                                }}
                                            >
                                                {account.company.company_name}
                                            </Typography>
                                            <Chip
                                                label={account.company.sector}
                                                size="small"
                                                variant="outlined"
                                                sx={{fontSize: '0.75rem'}}
                                            />
                                        </Box>

                                        <Box>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <CalendarToday sx={{fontSize: 16, color: 'text.secondary'}}/>
                                                <Typography variant="caption" color="text.secondary">
                                                    Kayıt Tarihi: {formatDate(account.created_at)}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </>
                                )}
                            </Stack>
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
