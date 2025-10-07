import {useState} from 'react'
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import backGroundImage from '../images/allinone-trade-background.png';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import * as React from "react";
import {useAuth} from "../contexts/AuthContext";
import LanguageSelector from '../components/LanguageSelector';
import Link from '@mui/material/Link';
import Copyright from '../components/Copyright';
import {useHideAppBar} from "../contexts/AppBarContext";

export default function SignInSide() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isEmailNotVerified, setIsEmailNotVerified] = useState(false);
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const {login} = useAuth();
    useHideAppBar();

    const handleResendVerification = async () => {
        setIsResending(true);
        setResendMessage('');

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/verify-email/send`, {
                emailOrUsername: emailOrUsername
            });

            if (response.data.status === "success") {
                setResendMessage(response.data.message || 'Doğrulama e-postası başarıyla gönderildi.');
                setErrorMessage('');
                setIsEmailNotVerified(false);
            }
        } catch (error) {
            if (error.response) {
                setResendMessage(error.response.data.message || 'E-posta gönderilemedi. Lütfen tekrar deneyiniz.');
            } else {
                setResendMessage('Bir hata oluştu. Lütfen tekrar deneyiniz.');
            }
        } finally {
            setIsResending(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const loginData = {
            username: data.get('username'),
            password: data.get('password'),
            rememberMe: false
        };

        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/sign-in`, loginData);
            if (response.data.status === "success") {
                login({token: response.data.token});
                navigate('/');
            }
        } catch (error) {

            if (error.response) {
                // E-posta doğrulanmamış hatası (403)
                if (error.response.status === 403) {
                    setIsEmailNotVerified(true);
                    setEmailOrUsername(loginData.username);
                    setErrorMessage(error.response.data.message || 'E-posta adresiniz doğrulanmamış.');
                } else {
                    setIsEmailNotVerified(false);
                    // API'den dönen hata mesajı
                    setErrorMessage(error.response.data.message || t('login.errors.defaultError'));
                }
            } else if (error.request) {
                // Network hatası
                setIsEmailNotVerified(false);
                setErrorMessage(t('login.errors.serverError'));
            } else {
                // Diğer hatalar
                setIsEmailNotVerified(false);
                setErrorMessage(t('login.errors.unexpectedError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Grid container component="main" sx={{height: '100vh'}}>
            <CssBaseline/>
            <Grid
                item
                xs={false}
                sm={4}
                md={7}
                sx={{
                    backgroundImage: `url(${backGroundImage})`,
                    backgroundColor: (t) =>
                        t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                    backgroundSize: 'cover',
                    backgroundPosition: 'left',
                }}
            />
            <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                <Box
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 1000
                    }}
                >
                    <LanguageSelector />
                </Box>
                <Box
                    sx={{
                        my: 8,
                        mx: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Avatar sx={{m: 1, bgcolor: 'primary.main'}}>
                        <LockOutlinedIcon/>
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        {t('login.title')}
                    </Typography>
                    <Box component="form" noValidate onSubmit={handleSubmit} sx={{mt: 1}}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label={t('login.username')}
                            name="username"
                            autoComplete="username"
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label={t('login.password')}
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"

                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    <IconButton
                                        tabIndex={-1}
                                        aria-label="toggle password visibility"
                                        onClick={() => setShowPassword(true)}
                                        onMouseDown={() => setShowPassword(false)}
                                    >
                                        {showPassword ? <VisibilityOff/> : <Visibility/>}
                                    </IconButton>
                                </InputAdornment>
                            }}
                        />
                        {errorMessage && !isEmailNotVerified && (
                            <Typography sx={{textAlign: 'center', color: 'error.main'}}
                                        variant='body2'>{errorMessage}</Typography>
                        )}

                        {isEmailNotVerified && (
                            <Box sx={{ mt: 2 }}>
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    {errorMessage}
                                </Alert>
                                <Button
                                    disabled={isResending}
                                    onClick={handleResendVerification}
                                    fullWidth
                                    variant="outlined"
                                    color="warning"
                                    sx={{ mb: 2 }}
                                >
                                    {isResending ? <CircularProgress size={24} color="inherit"/> : 'Doğrulama E-postasını Tekrar Gönder'}
                                </Button>
                            </Box>
                        )}

                        {resendMessage && (
                            <Alert severity={resendMessage.includes('başarıyla') ? 'success' : 'error'} sx={{ mt: 2, mb: 2 }}>
                                {resendMessage}
                            </Alert>
                        )}

                        <Button
                            disabled={isLoading}
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{mt: 3, mb: 2}}
                        >
                            {isLoading ? <CircularProgress color="inherit"/> : <>{t('login.loginButton')}</>}
                        </Button>
                        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
                            Hesabınız yok mu?{' '}
                            <Link
                                component="button"
                                variant="body2"
                                onClick={() => navigate('/sign-up')}
                                sx={{ cursor: 'pointer' }}
                            >
                                Kayıt Olun
                            </Link>
                        </Typography>
                    </Box>
                    <Copyright />
                </Box>
            </Grid>
        </Grid>
    );
}