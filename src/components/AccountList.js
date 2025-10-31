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
    MoreVert,
    History
} from '@mui/icons-material';
import axios from 'axios';
import {useAuth} from '../contexts/AuthContext';
import MoneyTransferDialog from './MoneyTransferDialog';
import ExternalMoneyDialog from './ExternalMoneyDialog';
import TransfersDialog from './TransfersDialog';
import { useTranslation } from 'react-i18next';

export default function AccountList() {
    const { t, i18n } = useTranslation(['accounts']);
    const {token, user} = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [externalMoneyDialogOpen, setExternalMoneyDialogOpen] = useState(false);
    const [transfersDialogOpen, setTransfersDialogOpen] = useState(false);

    const mapLngToLocale = (lng) => {
        switch (lng) {
            case 'tr': return 'tr-TR';
            case 'de': return 'de-DE';
            default: return 'en-US';
        }
    };

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/accounts`,
                    {
                        headers: { 'x-access-token': token }
                    }
                );

                if (response.data.status === 'success') {
                    setAccounts(response.data.accounts);
                }
            } catch (err) {
                console.error(t('accounts:errors.consoleLoadError'), err);
                if (err.response) {
                    setError(err.response.data.message || t('accounts:errors.loadFailed'));
                } else if (err.request) {
                    setError(t('accounts:errors.serverUnreachable'));
                } else {
                    setError(t('accounts:errors.unexpected'));
                }
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchAccounts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(mapLngToLocale(i18n.language), {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatBalance = (balance, currency) => {
        return new Intl.NumberFormat(mapLngToLocale(i18n.language), {
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

    const handleTransfersHistoryClick = () => {
        handleMenuClose();
        setTransfersDialogOpen(true);
    };

    const handleTransfersDialogClose = () => {
        setTransfersDialogOpen(false);
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
                    {t('accounts:empty')}
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
                    {t('accounts:title')}
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
                                    aria-label={t('accounts:aria.more')}
                                >
                                    <MoreVert />
                                </IconButton>

                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Person sx={{ fontSize: 28, color: 'primary.main' }} />

                                    <Box>
                                        {/* Kullanıcı adı */}
                                        <Typography
                                                variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.1 }}
                                        >
                                            {account.name}
                                        </Typography>

                                        {/* Firma adı (accountName altı) */}
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
                                    {t('accounts:balance')}
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
                                                opacity: 0.55,
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
                                        {t('accounts:registeredAt', { date: formatDate(account.created_at) })}
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
                    {t('accounts:menu.moneyTransfer')}
                </MenuItem>
                <MenuItem onClick={handleExternalMoneyClick}>
                    {t('accounts:menu.addIncome')}
                </MenuItem>
                <MenuItem onClick={handleTransfersHistoryClick}>
                    <History sx={{ mr: 1, fontSize: 20 }} />
                    {t('accounts:menu.viewTransferHistory', 'Geçmiş Transferleri Gör')}
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

            <TransfersDialog
                open={transfersDialogOpen}
                onClose={handleTransfersDialogClose}
                accountId={selectedAccount?.id || null}
                userId={user.id}
            />
        </Container>
    );
}
