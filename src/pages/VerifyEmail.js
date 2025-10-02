import { useEffect, useState } from 'react';
import AppBar from '../components/AppBar';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EmailIcon from '@mui/icons-material/Email';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';

const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(5),
    gap: theme.spacing(3),
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
    borderRadius: theme.spacing(3),
    border: `1px solid ${theme.palette.divider}`,
    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
    [theme.breakpoints.up('sm')]: {
        width: '500px',
    },
    ...theme.applyStyles('dark', {
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.3)',
    }),
}));

const IconWrapper = styled(Box)(({ theme, status }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: '50%',
    marginBottom: theme.spacing(2),
    background: status === 'success'
        ? `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`
        : status === 'error'
            ? `linear-gradient(135deg, ${theme.palette.error.light} 0%, ${theme.palette.error.main} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    animation: 'pulse 2s ease-in-out infinite',
    '@keyframes pulse': {
        '0%': {
            transform: 'scale(1)',
        },
        '50%': {
            transform: 'scale(1.05)',
        },
        '100%': {
            transform: 'scale(1)',
        },
    },
}));

const StatusMessage = styled(Typography)(({ theme }) => ({
    textAlign: 'center',
    marginBottom: theme.spacing(2),
    fontWeight: 500,
    lineHeight: 1.6,
}));

const ActionButton = styled(Button)(({ theme }) => ({
    padding: theme.spacing(1.5, 4),
    borderRadius: theme.spacing(2),
    textTransform: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
    },
}));

export default function VerifyEmailPage() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);

    // Token değiştiğinde e-posta doğrulama işlemini yap
    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/verify-email/${token}`);
                setResult(response.data);
            } catch (error) {
                setResult(error.response?.data || {
                    status: 'error',
                    message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.'
                });
            } finally {
                setLoading(false);
            }
        };

        verifyEmail();
        // eslint-disable-next-line
    }, [token]);

    const renderContent = () => {
        if (loading) {
            return (
                <Fade in={loading}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <IconWrapper status="loading">
                            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <EmailIcon sx={{ fontSize: 40, color: 'white', zIndex: 1 }} />
                                <CircularProgress
                                    size={80}
                                    sx={{
                                        color: 'white',
                                        position: 'absolute',
                                        opacity: 0.8
                                    }}
                                />
                            </Box>
                        </IconWrapper>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                            Doğrulama İşlemi Yapılıyor
                        </Typography>
                        <StatusMessage variant="body1" color="text.secondary">
                            E-posta adresiniz doğrulanıyor, lütfen bekleyiniz...
                        </StatusMessage>
                    </Box>
                </Fade>
            );
        }


        if (result?.status === 'error') {
            return (
                <Fade in={!loading}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <IconWrapper status="error">
                            <ErrorIcon sx={{ fontSize: 40, color: 'white' }} />
                        </IconWrapper>
                        <Typography variant="h5" color="error" sx={{ mb: 2, fontWeight: 600 }}>
                            Doğrulama Başarısız
                        </Typography>
                        <StatusMessage variant="body1" color="text.secondary">
                            {result.message}
                        </StatusMessage>
                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            <ActionButton
                                variant="outlined"
                                startIcon={<HomeIcon />}
                                onClick={() => navigate('/')}
                            >
                                Ana Sayfa
                            </ActionButton>
                            <ActionButton
                                variant="contained"
                                startIcon={<LoginIcon />}
                                onClick={() => navigate('/sign-in')}
                            >
                                Giriş Yap
                            </ActionButton>
                        </Stack>
                    </Box>
                </Fade>
            );
        }

        return (
            <Fade in={!loading}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <IconWrapper status="success">
                        <CheckCircleIcon sx={{ fontSize: 40, color: 'white' }} />
                    </IconWrapper>
                    <Typography variant="h5" color="success.main" sx={{ mb: 2, fontWeight: 600 }}>
                        E-posta Başarıyla Doğrulandı!
                    </Typography>
                    <StatusMessage variant="body1" color="text.secondary">
                        {result?.message || 'Hesabınız aktif hale getirildi. Artık tüm özelliklerden faydalanabilirsiniz.'}
                    </StatusMessage>
                    <ActionButton
                        variant="contained"
                        size="large"
                        startIcon={<LoginIcon />}
                        onClick={() => navigate('/sign-in')}
                        sx={{ mt: 3 }}
                    >
                        Giriş Yap
                    </ActionButton>
                </Box>
            </Fade>
        );
    };

    return (
        <>
            <AppBar />
            <Stack
                direction="column"
                component="main"
                sx={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    paddingTop: '90px',
                    paddingBottom: 2,
                    paddingX: 2,
                }}
            >
                <Card>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography
                            component="h1"
                            variant="h4"
                            sx={{
                                fontSize: 'clamp(1.8rem, 5vw, 2.2rem)',
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                mb: 1
                            }}
                        >
                            E-posta Doğrulama
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Hesabınızı aktifleştirmek için e-posta doğrulaması
                        </Typography>
                    </Box>

                    {renderContent()}
                </Card>
            </Stack>
        </>
    );
}