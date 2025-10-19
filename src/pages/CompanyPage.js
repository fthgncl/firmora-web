import React, {useState, useEffect, useRef} from 'react';
import {
    Container,
    Box,
    Typography,
    Grid,
    CircularProgress,
    Alert,
    IconButton,
    Card,
    CardContent,
    Chip,
    Avatar,
    Stack,
    Tooltip,
} from '@mui/material';
import {
    ArrowBack,
    Business,
    AccountBalance,
    CalendarToday,
    Settings,
    AccountBalanceWalletOutlined,
    AddCircleOutline,
} from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {useAlert} from '../contexts/AlertContext';
import UserList from '../components/UsersList';
import MoneyTransferDialog from '../components/MoneyTransferDialog';
import ExternalMoneyDialog from '../components/ExternalMoneyDialog';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function CompanyPage() {
    const {companyId} = useParams();
    const {token} = useAuth();
    const navigate = useNavigate();
    const {showAlert} = useAlert();
    const { t, i18n } = useTranslation(['company']);

    const userListRef = useRef();
    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState(null);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [externalMoneyDialogOpen, setExternalMoneyDialogOpen] = useState(false);

    useEffect(() => {
        fetchCompanyDetails();
        // eslint-disable-next-line
    }, [companyId, token]);

    const mapLngToLocale = (lng) => {
        switch (lng) {
            case 'tr': return 'tr-TR';
            case 'de': return 'de-DE';
            default: return 'en-US';
        }
    };

    const fetchCompanyDetails = async () => {
        try {
            setLoading(true);

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/companies/get`,
                {companyId},
                {
                    headers: {
                        'x-access-token': token,
                    },
                }
            );

            if (response.data.success) {
                setCompany(response.data.data);
            } else {
                showAlert(response.data.message || t('company:errors.loadFailed'), 'error');
                navigate('/');
            }
        } catch (err) {
            console.error(t('company:errors.consoleLoadError'), err);
            showAlert(t('company:errors.loadErrorGeneric'), 'error');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(mapLngToLocale(i18n.language), {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatBalance = (balance, currency) => {
        return new Intl.NumberFormat(mapLngToLocale(i18n.language), {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(balance);
    };

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{mt: 4, mb: 4}}>
                <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh'}}>
                    <CircularProgress size={60}/>
                </Box>
            </Container>
        );
    }

    if (!company) {
        return (
            <Container maxWidth="xl" sx={{mt: 4, mb: 4}}>
                <Alert severity="error" sx={{borderRadius: 2}}>
                    {t('company:errors.notFound')}
                </Alert>
            </Container>
        );
    }

    const hasSector = !!(company.sector && String(company.sector).trim().length);

    return (
        <Container maxWidth="xl" sx={{mt: 4, mb: 4}}>
            {/* Header */}
            <Box sx={{mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                    <IconButton
                        onClick={() => navigate('/')}
                        sx={{bgcolor: 'background.paper', boxShadow: 1, '&:hover': {bgcolor: 'action.hover'}}}
                        aria-label={t('company:aria.back')}
                    >
                        <ArrowBack/>
                    </IconButton>

                    <Avatar sx={{width: 56, height: 56, bgcolor: 'primary.main'}}>
                        <Business sx={{fontSize: 32}}/>
                    </Avatar>

                    <Box>
                        <Typography variant="h4" component="h1" sx={{fontWeight: 700, mb: 0.5}}>
                            {company.company_name}
                        </Typography>
                        {hasSector && (
                            <Chip label={company.sector} size="small" color="primary" variant="outlined" />
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Firma Özeti Kartı */}
            <Grid container spacing={3} sx={{mb: 4}}>
                <Grid item xs={12}>
                    <Card sx={{overflow: 'hidden', position: 'relative'}}>
                        <CardContent>
                            <Grid container spacing={3}>
                                {/* Sol: Bakiye ve butonlar */}
                                <Grid item xs={12} md={5}>
                                    <Box
                                        sx={{
                                            p: 3,
                                            borderRadius: 2,
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            position: 'relative',
                                        }}
                                    >
                                        {/* Sağ üstte üç profesyonel buton */}
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{
                                                position: 'absolute',
                                                top: 12,
                                                right: 12,
                                            }}
                                        >
                                            <Tooltip title={t('company:menu.moneyTransfer')}>
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        color: 'white',
                                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                                        '&:hover': {backgroundColor: 'rgba(255,255,255,0.25)'},
                                                    }}
                                                    onClick={() => setTransferDialogOpen(true)}
                                                >
                                                    <AccountBalanceWalletOutlined fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('company:menu.addIncome')}>
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        color: 'white',
                                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                                        '&:hover': {backgroundColor: 'rgba(255,255,255,0.25)'},
                                                    }}
                                                    onClick={() => setExternalMoneyDialogOpen(true)}
                                                >
                                                    <AddCircleOutline fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('company:goToSettings')}>
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        color: 'white',
                                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                                        '&:hover': {backgroundColor: 'rgba(255,255,255,0.25)'},
                                                    }}
                                                    onClick={() => navigate(`/company/${companyId}/settings`)}
                                                >
                                                    <Settings fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>

                                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{mb: 1, mt: 1}}>
                                            <Avatar sx={{bgcolor: 'rgba(255,255,255,0.2)', color:'white'}}>
                                                <AccountBalance/>
                                            </Avatar>
                                            <Typography variant="h6" sx={{fontWeight: 600}}>
                                                {t('company:currentBalance')}
                                            </Typography>
                                        </Stack>

                                        <Typography variant="h3" sx={{fontWeight: 800, lineHeight: 1.1}}>
                                            {formatBalance(company.balance, company.currency)}
                                        </Typography>

                                        <Typography variant="body2" sx={{opacity: 0.9, mt: 0.5}}>
                                            {t('company:currencyStatus', { currency: company.currency })}
                                        </Typography>

                                        <Stack direction="row" spacing={1} sx={{mt: 2, flexWrap: 'wrap'}}>
                                            <Chip
                                                size="small"
                                                color={company.balance >= 0 ? 'success' : 'error'}
                                                label={company.balance >= 0 ? t('company:positive') : t('company:negative')}
                                                variant="filled"
                                                sx={{color: 'white'}}
                                            />
                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                sx={{borderColor: 'rgba(255,255,255,0.5)', color: 'white'}}
                                                label={company.currency}
                                            />
                                        </Stack>
                                    </Box>
                                </Grid>

                                {/* Sağ: Firma Bilgileri */}
                                <Grid item xs={12} md={7}>
                                    <Stack spacing={1.5} sx={{height: '100%'}}>
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <Avatar sx={{bgcolor: 'primary.main'}}><Business/></Avatar>
                                            <Typography variant="h6" sx={{fontWeight: 700}}>
                                                {t('company:companyInfo')}
                                            </Typography>
                                        </Stack>

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="overline" color="text.secondary">
                                                    {t('company:companyName')}
                                                </Typography>
                                                <Typography variant="body1" sx={{fontWeight: 600}}>
                                                    {company.company_name}
                                                </Typography>
                                            </Grid>

                                            {hasSector && (
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="overline" color="text.secondary">
                                                        {t('company:sector')}
                                                    </Typography>
                                                    <Typography variant="body1" sx={{fontWeight: 600}}>
                                                        {company.sector}
                                                    </Typography>
                                                </Grid>
                                            )}

                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="overline" color="text.secondary">
                                                    {t('company:creationDate')}
                                                </Typography>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <CalendarToday fontSize="small" color="success"/>
                                                    <Typography variant="body1" sx={{fontWeight: 600}}>
                                                        {formatDate(company.created_at)}
                                                    </Typography>
                                                </Stack>
                                            </Grid>
                                        </Grid>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Kullanıcı Listesi */}
            <Grid sx={{mt: 4}}>
                <UserList ref={userListRef} companyId={companyId}/>
            </Grid>

            {/* Dialoglar */}
            <MoneyTransferDialog
                open={transferDialogOpen}
                onClose={() => setTransferDialogOpen(false)}
                sourceAccount={company}
                fromScope="company"
            />
            <ExternalMoneyDialog
                open={externalMoneyDialogOpen}
                onClose={() => setExternalMoneyDialogOpen(false)}
                targetAccount={company}
                targetScope="company"
            />
        </Container>
    );
}
