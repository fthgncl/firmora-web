import React, {useState, useEffect, useRef} from 'react';
import {
    Container,
    Box,
    Typography,
    Paper,
    Grid,
    CircularProgress,
    Alert,
    IconButton,
    Card,
    CardContent,
    Chip,
    Avatar,
    Menu,
    MenuItem,
} from '@mui/material';
import {
    ArrowBack,
    Business,
    AccountBalance,
    CalendarToday,
    TrendingUp,
    Settings,
    MoreVert,
} from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {useAlert} from '../contexts/AlertContext';
import UserList from '../components/UsersList';
import AddUserToCompany from '../components/AddUserToCompany';
import MoneyTransferDialog from '../components/MoneyTransferDialog';
import ExternalMoneyDialog from '../components/ExternalMoneyDialog';
import axios from 'axios';

export default function CompanyPage() {
    const {companyId} = useParams();
    const {token} = useAuth();
    const navigate = useNavigate();
    const {showAlert} = useAlert();

    const userListRef = useRef();
    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [externalMoneyDialogOpen, setExternalMoneyDialogOpen] = useState(false);

    useEffect(() => {
        fetchCompanyDetails();
        // eslint-disable-next-line
    }, [companyId, token]);

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
                showAlert(response.data.message || 'Firma bilgileri alınamadı', 'error');
                navigate('/');
            }
        } catch (err) {
            console.error('Firma bilgileri yüklenirken hata:', err);
            if (err.response && err.response.data) {
                showAlert(err.response.data.message || 'Firma bilgileri yüklenirken bir hata oluştu', 'error');
            } else if (err.request) {
                showAlert('Sunucuya ulaşılamıyor', 'error');
            } else {
                showAlert('Beklenmeyen bir hata oluştu', 'error');
            }
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatBalance = (balance, currency) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(balance);
    };

    const handleUserAdded = () => {
        if (userListRef.current) {
            userListRef.current.refresh();
        }
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
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
    };

    const handleExternalMoneyClick = () => {
        handleMenuClose();
        setExternalMoneyDialogOpen(true);
    };

    const handleExternalMoneyDialogClose = () => {
        setExternalMoneyDialogOpen(false);
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
                    Firma bulunamadı
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{mt: 4, mb: 4}}>
            {/* Header */}
            <Box sx={{mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                    <IconButton
                        onClick={() => navigate('/')}
                        sx={{
                            bgcolor: 'background.paper',
                            boxShadow: 1,
                            '&:hover': {bgcolor: 'action.hover'}
                        }}
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
                        <Chip
                            label={company.sector}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    </Box>
                </Box>
                <IconButton
                    onClick={() => navigate(`/company/${companyId}/settings`)}
                    sx={{
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                        '&:hover': {bgcolor: 'action.hover'}
                    }}
                >
                    <Settings/>
                </IconButton>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{mb: 4}}>
                {/* Balance Card */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card
                        sx={{
                            height: '100%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <Box sx={{position: 'absolute', top: 8, right: 8, zIndex: 1}}>
                            <IconButton
                                onClick={handleMenuOpen}
                                size="small"
                                sx={{
                                    color: 'rgba(255,255,255,0.9)',
                                    '&:hover': {
                                        color: 'white',
                                        backgroundColor: 'rgba(255,255,255,0.1)'
                                    }
                                }}
                            >
                                <MoreVert />
                            </IconButton>
                        </Box>
                        <CardContent>
                            <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                <Avatar sx={{bgcolor: 'rgba(255,255,255,0.2)', mr: 2}}>
                                    <AccountBalance/>
                                </Avatar>
                                <Typography variant="h6" sx={{fontWeight: 600}}>
                                    Mevcut Bakiye
                                </Typography>
                            </Box>
                            <Typography variant="h3" sx={{fontWeight: 700, mb: 1}}>
                                {formatBalance(company.balance, company.currency)}
                            </Typography>
                            <Typography variant="body2" sx={{opacity: 0.9}}>
                                {company.currency} • Güncel Durum
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Company Info Card */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card sx={{height: '100%'}}>
                        <CardContent>
                            <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                <Avatar sx={{bgcolor: 'primary.main', mr: 2}}>
                                    <Business/>
                                </Avatar>
                                <Typography variant="h6" sx={{fontWeight: 600}}>
                                    Firma Bilgileri
                                </Typography>
                            </Box>
                            <Box sx={{mb: 2}}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Firma Adı
                                </Typography>
                                <Typography variant="body1" sx={{fontWeight: 600, mb: 2}}>
                                    {company.company_name}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Sektör
                                </Typography>
                                <Typography variant="body1" sx={{fontWeight: 600}}>
                                    {company.sector}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Date Info Card */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card sx={{height: '100%'}}>
                        <CardContent>
                            <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                <Avatar sx={{bgcolor: 'success.main', mr: 2}}>
                                    <CalendarToday/>
                                </Avatar>
                                <Typography variant="h6" sx={{fontWeight: 600}}>
                                    Oluşturma Tarihi
                                </Typography>
                            </Box>
                            <Typography variant="h5" sx={{fontWeight: 700, mb: 1}}>
                                {formatDate(company.created_at)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Firma kayıt tarihi
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Additional Info */}
            <Paper sx={{p: 4}}>
                <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
                    <TrendingUp sx={{fontSize: 28, color: 'primary.main', mr: 1.5}}/>
                    <Typography variant="h5" sx={{fontWeight: 600}}>
                        Özet Bilgiler
                    </Typography>
                </Box>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Firma ID
                            </Typography>
                            <Typography variant="body1" sx={{fontWeight: 600, fontFamily: 'monospace'}}>
                                {company.id}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Para Birimi
                            </Typography>
                            <Typography variant="body1" sx={{fontWeight: 600}}>
                                {company.currency}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Bakiye Durumu
                            </Typography>
                            <Chip
                                label={company.balance >= 0 ? 'Pozitif' : 'Negatif'}
                                color={company.balance >= 0 ? 'success' : 'error'}
                                size="small"
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Sektör
                            </Typography>
                            <Typography variant="body1" sx={{fontWeight: 600}}>
                                {company.sector}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Kullanıcı Ekleme */}
            <Grid container spacing={3} sx={{mt: 2}}>
                <Grid item xs={12} md={4}>
                    <AddUserToCompany companyId={companyId} onUserAdded={handleUserAdded}/>
                </Grid>
            </Grid>

            {/* Kullanıcı Listesi */}
            <Grid sx={{mt: 4}}>
                <UserList ref={userListRef} companyId={companyId}/>
            </Grid>

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
                sourceAccount={company}
                fromScope="company"
            />

            <ExternalMoneyDialog
                open={externalMoneyDialogOpen}
                onClose={handleExternalMoneyDialogClose}
                targetAccount={company}
                targetScope="company"
            />
        </Container>
    );
}
