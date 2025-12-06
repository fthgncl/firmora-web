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
    SwapHoriz,
    AddCircleOutline,
} from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {useAlert} from '../contexts/AlertContext';
import UserList from '../components/UsersList';
import MoneyTransferDialog from '../components/MoneyTransferDialog';
import ExternalMoneyDialog from '../components/ExternalMoneyDialog';
import CompanySettingsDialog from '../components/CompanySettingsDialog';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import TransfersTable from "../components/TransfersTable";

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
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

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

            console.error(err.response.data.message || t('company:errors.consoleLoadError'), err);
            showAlert(err.response.data.message || t('company:errors.loadErrorGeneric'), 'error');
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
                                {company?.balance !== undefined && company?.balance !== null && (
                                    <Grid item xs={12} md={5}>
                                        <Box
                                            sx={{
                                                p: 3,
                                                borderRadius: 2,
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                position: 'relative',

                                                /* 🔸 Container Query için gerekli */
                                                containerType: 'inline-size',
                                                containerName: 'balanceCard',
                                            }}
                                        >
                                            {/* Sağ üstte üç profesyonel buton */}
                                            <Stack
                                                direction={{ xs: 'column', sm: 'row', md:'column' }} // xs’te dikey, sm+ yatay
                                                spacing={1}
                                                sx={{
                                                    position: 'absolute',           // ⬅️ her zaman absolute (boşluk bırakmaz)
                                                    top: 12,
                                                    right: 12,
                                                    alignItems: 'flex-end',
                                                    '& .MuiIconButton-root': {
                                                        width: 40,
                                                        height: 40,
                                                        color: 'white',
                                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' },
                                                        transition: 'all 0.2s ease',
                                                    },
                                                    '& .MuiSvgIcon-root': { fontSize: 20 },

                                                    /* Kartın kendi genişliği daraldığında: dikey kalsın, absolute kalsın, butonları ufalt */
                                                    '@container balanceCard (max-width: 420px)': {
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-end',
                                                        right: 8,
                                                        top: 8,
                                                        '& .MuiIconButton-root': {
                                                            width: 36,
                                                            height: 36,
                                                        },
                                                    },
                                                }}
                                            >
                                                <Tooltip title={t('company:menu.moneyTransfer')}>
                                                    <IconButton onClick={() => setTransferDialogOpen(true)}>
                                                        <SwapHoriz />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('company:menu.addIncome')}>
                                                    <IconButton onClick={() => setExternalMoneyDialogOpen(true)}>
                                                        <AddCircleOutline />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('company:goToSettings')}>
                                                    <IconButton onClick={() => setSettingsDialogOpen(true)}>
                                                        <Settings />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>


                                            {/* Başlık */}
                                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1, mt: 1 }}>
                                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                                    <AccountBalance />
                                                </Avatar>
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    {t('company:currentBalance')}
                                                </Typography>
                                            </Stack>

                                            {/* Bakiye + Sağ tarafta Toplam & Sahadaki */}
                                            {(() => {
                                                const total = company?.totalBalance;
                                                const balance = company.balance ?? 0;
                                                const inField = (typeof total === 'number') ? (total - balance) : undefined;

                                                return (
                                                    <Stack
                                                        direction="row"
                                                        alignItems="flex-start"
                                                        justifyContent="space-between"
                                                        sx={{
                                                            mb: 0.5,
                                                            gap: 1.5,
                                                            flexWrap: 'wrap',

                                                            /* 🔸 Kart genişliği daralınca otomatik kolon yerleşimi */
                                                            '@container balanceCard (max-width: 560px)': {
                                                                flexDirection: 'column',
                                                                alignItems: 'flex-start',
                                                            },
                                                        }}
                                                    >
                                                        {/* Mevcut Bakiye (sol, büyük) */}
                                                        <Typography
                                                            variant="h3"
                                                            sx={{
                                                                fontWeight: 800,
                                                                lineHeight: 1.1,
                                                                fontVariantNumeric: 'tabular-nums',
                                                                fontSize: { xs: 'clamp(24px, 7vw, 34px)', sm: 'clamp(28px, 4vw, 42px)' },
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {formatBalance(balance, company.currency)}
                                                        </Typography>

                                                        {/* Sağ sütun: Toplam Bakiye + Sahadaki Bakiye */}
                                                        {typeof total === 'number' && (
                                                            <Box
                                                                sx={{
                                                                    ml: 2,
                                                                    textAlign: 'right',
                                                                    color: 'rgba(255,255,255,0.9)',
                                                                    borderLeft: '1px solid rgba(255,255,255,0.2)',
                                                                    pl: 1.5,
                                                                    minWidth: 0,
                                                                    flex: '0 1 46%',

                                                                    /* 🔸 Dar alanda sağ blok alta insin ve sola hizalansın */
                                                                    '@container balanceCard (max-width: 560px)': {
                                                                        ml: 0,
                                                                        pl: 0,
                                                                        borderLeft: 'none',
                                                                        textAlign: 'left',
                                                                        flex: '1 1 100%',
                                                                    },
                                                                }}
                                                            >
                                                                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.1 }}>
                                                                    {t('company:totalBalance')}
                                                                </Typography>
                                                                <Typography
                                                                    variant="subtitle2"
                                                                    sx={{
                                                                        opacity: 0.9,
                                                                        fontWeight: 600,
                                                                        fontVariantNumeric: 'tabular-nums',
                                                                        whiteSpace: 'nowrap',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                    }}
                                                                >
                                                                    {formatBalance(total, company.currency)}
                                                                </Typography>

                                                                {typeof inField === 'number' && (
                                                                    <Box sx={{ mt: 1 }}>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.1 }}>
                                                                            {t('company:inFieldBalance')}
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="subtitle2"
                                                                            sx={{
                                                                                opacity: 0.9,
                                                                                fontWeight: 600,
                                                                                fontVariantNumeric: 'tabular-nums',
                                                                                whiteSpace: 'nowrap',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                            }}
                                                                        >
                                                                            {formatBalance(inField, company.currency)}
                                                                        </Typography>
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        )}
                                                    </Stack>
                                                );
                                            })()}

                                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                {t('company:currencyStatus', { currency: company.currency })}
                                            </Typography>

                                            {/* Chipler */}
                                            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                                                <Chip
                                                    size="small"
                                                    color={company.balance >= 0 ? 'success' : 'error'}
                                                    label={company.balance >= 0 ? t('company:positive') : t('company:negative')}
                                                    variant="filled"
                                                    sx={{ color: 'white' }}
                                                />
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}
                                                    label={company.currency}
                                                />
                                            </Stack>
                                        </Box>
                                    </Grid>


                                )}


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

            {/* Transfer Kayıtları Listesi Listesi */}
            <Grid sx={{mt: 4}}>
                <TransfersTable companyId={companyId}/>
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
            <CompanySettingsDialog
                open={settingsDialogOpen}
                onClose={() => setSettingsDialogOpen(false)}
                company={company}
                onUpdateSuccess={fetchCompanyDetails}
            />
        </Container>
    );
}
