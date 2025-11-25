import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AppBar from '../components/AppBar';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import { styled } from '@mui/material/styles';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LockResetIcon from '@mui/icons-material/LockReset';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import resetPasswordSchema from '../schemas/resetPasswordSchema';
import {jwtDecode} from "jwt-decode";

const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(2),
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

export default function ResetPassword() {
    const { t } = useTranslation(['resetPassword']);
    const { token } = useParams();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [validatingToken, setValidatingToken] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (user && tokenValid)
            logout();
        // eslint-disable-next-line
    }, [user, tokenValid]);

    useEffect(() => {
        // Token geçerliliğini kontrol et
        const validateToken = async () => {
            try {
                // Token var mı kontrol et
                if (!token) {
                    setResult({
                        status: 'error',
                        message: t('resetPassword:status.error.invalidToken')
                    });
                    return;
                }

                // Token'ı çözümle
                try {
                    const decodedToken = jwtDecode(token);

                    // Token içeriğinde id ve email olup olmadığını kontrol et
                    if (!decodedToken.id || !decodedToken.email) {
                        setResult({
                            status: 'error',
                            message: t('resetPassword:status.error.invalidFormat')
                        });
                        return;
                    }

                    // Token'ın süresinin dolup dolmadığını kontrol et
                    const currentTime = Date.now() / 1000; // Şu anki zaman (saniye cinsinden)
                    if (decodedToken.exp && decodedToken.exp < currentTime) {
                        setResult({
                            status: 'error',
                            message: t('resetPassword:status.error.expired')
                        });
                        return;
                    }

                    // Token geçerli
                    setTokenValid(true);
                } catch (decodeError) {
                    console.error('Token çözümleme hatası:', decodeError);
                    setResult({
                        status: 'error',
                        message: t('resetPassword:status.error.invalidLink')
                    });
                }
            } catch (error) {
                setResult({
                    status: 'error',
                    message: error.response?.data?.message || t('resetPassword:status.error.generic')
                });
            } finally {
                setValidatingToken(false);
                setLoading(false);
            }
        };

        validateToken();
        // eslint-disable-next-line
    }, [token]);

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    const formik = useFormik({
        initialValues: {
            newPassword: '',
            confirmPassword: ''
        },
        validationSchema: resetPasswordSchema(t),
        onSubmit: async (values) => {
            setSubmitting(true);
            try {
                // Token bilgilerini çöz
                const decodedToken = jwtDecode(token);
                const userId = decodedToken.id;
                const userEmail = decodedToken.email;

                // API isteği ile şifre güncelleme
                const response = await axios.post(
                    `${process.env.REACT_APP_API_URL}/password-reset/token/${token}`,
                    {
                        newPassword: values.newPassword,
                        userId: userId,
                        email: userEmail
                    }
                );

                setResult({
                    status: 'success',
                    message: response.data.message || t('resetPassword:status.success.defaultMessage')
                });
            } catch (error) {
                setResult({
                    status: 'error',
                    message: error.response?.data?.message || t('resetPassword:status.error.resetFailed')
                });
            } finally {
                setSubmitting(false);
                setLoading(false);
            }
        }
    });

    const renderContent = () => {
        if (loading && validatingToken) {
            return (
                <Fade in={loading}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <IconWrapper status="loading">
                            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <LockResetIcon sx={{ fontSize: 40, color: 'white', zIndex: 1 }} />
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
                            {t('resetPassword:status.validating.title')}
                        </Typography>
                        <StatusMessage variant="body1" color="text.secondary">
                            {t('resetPassword:status.validating.message')}
                        </StatusMessage>
                    </Box>
                </Fade>
            );
        }

        if (result?.status === 'error' || !tokenValid) {
            return (
                <Fade in={!loading}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <IconWrapper status="error">
                            <ErrorIcon sx={{ fontSize: 40, color: 'white' }} />
                        </IconWrapper>
                        <Typography variant="h5" color="error" sx={{ mb: 2, fontWeight: 600 }}>
                            {t('resetPassword:status.error.title')}
                        </Typography>
                        <StatusMessage variant="body1" color="text.secondary">
                            {result?.message || t('resetPassword:status.error.generic')}
                        </StatusMessage>
                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            <ActionButton
                                variant="outlined"
                                startIcon={<HomeIcon />}
                                onClick={() => navigate('/')}
                            >
                                {t('resetPassword:buttons.homePage')}
                            </ActionButton>
                            <ActionButton
                                variant="contained"
                                startIcon={<LoginIcon />}
                                onClick={() => navigate('/sign-in')}
                            >
                                {t('resetPassword:buttons.signIn')}
                            </ActionButton>
                        </Stack>
                    </Box>
                </Fade>
            );
        }

        if (result?.status === 'success') {
            return (
                <Fade in={!loading}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <IconWrapper status="success">
                            <CheckCircleIcon sx={{ fontSize: 40, color: 'white' }} />
                        </IconWrapper>
                        <Typography variant="h5" color="success.main" sx={{ mb: 2, fontWeight: 600 }}>
                            {t('resetPassword:status.success.title')}
                        </Typography>
                        <StatusMessage variant="body1" color="text.secondary">
                            {result.message || t('resetPassword:status.success.message')}
                        </StatusMessage>
                        <ActionButton
                            variant="contained"
                            size="large"
                            startIcon={<LoginIcon />}
                            onClick={() => navigate('/sign-in')}
                            sx={{ mt: 3 }}
                        >
                            {t('resetPassword:buttons.signIn')}
                        </ActionButton>
                    </Box>
                </Fade>
            );
        }

        return (
            <Fade in={!loading}>
                <Box sx={{ width: '100%' }}>
                    <Box
                        component="form"
                        onSubmit={formik.handleSubmit}
                        noValidate
                        sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 3 }}
                    >
                        <FormControl>
                            <FormLabel htmlFor="newPassword">{t('resetPassword:fields.newPassword')}</FormLabel>
                            <TextField
                                id="newPassword"
                                name="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t('resetPassword:placeholders.password')}
                                autoComplete="new-password"
                                autoFocus
                                tabIndex={1}
                                required
                                fullWidth
                                variant="outlined"
                                value={formik.values.newPassword}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
                                helperText={formik.touched.newPassword && formik.errors.newPassword}
                                disabled={submitting}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label={t('resetPassword:ariaLabels.togglePassword')}
                                                onClick={handleTogglePassword}
                                                edge="end"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel htmlFor="confirmPassword">{t('resetPassword:fields.confirmPassword')}</FormLabel>
                            <TextField
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t('resetPassword:placeholders.password')}
                                autoComplete="new-password"
                                required
                                fullWidth
                                tabIndex={2}
                                variant="outlined"
                                value={formik.values.confirmPassword}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                                disabled={submitting}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label={t('resetPassword:ariaLabels.toggleConfirmPassword')}
                                                onClick={handleTogglePassword}
                                                edge="end"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </FormControl>

                        <Button
                            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <LockResetIcon />}
                            disabled={!(formik.isValid && formik.dirty) || submitting}
                            type="submit"
                            fullWidth
                            variant={!(formik.isValid && formik.dirty) ? "outlined" : "contained"}
                            color="primary"
                            size="large"
                            sx={{
                                mt: 2
                            }}
                        >
                            {submitting ? t('resetPassword:buttons.resetting') : t('resetPassword:buttons.resetPassword')}
                        </Button>
                    </Box>
                </Box>
            </Fade>
        );
    };

    return (
        <>
            <AppBar />
            <Box
                component="main"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    minHeight: '100vh',
                    paddingTop: '100px',
                    paddingX: 2,
                    paddingBottom: 2,
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
                            {t('resetPassword:page.title')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('resetPassword:page.subtitle')}
                        </Typography>
                    </Box>

                    {renderContent()}
                </Card>
            </Box>
        </>
    );
}