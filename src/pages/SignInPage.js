import {useState} from 'react'
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import backGroundImage from '../images/login-background.png';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import * as React from "react";
import {useAuth} from "../contexts/AuthContext";
import LanguageSelector from '../components/LanguageSelector';
import Link from '@mui/material/Link';
import Copyright from '../components/Copyright';
import {useHideAppBar} from "../contexts/AppBarContext";
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import Snackbar from '@mui/material/Snackbar';

export default function SignInSide() {
    const { t } = useTranslation(['login']);
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isEmailNotVerified, setIsEmailNotVerified] = useState(false);
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [openForgotPasswordDialog, setOpenForgotPasswordDialog] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [isSendingReset, setIsSendingReset] = useState(false);
    const [resetErrorMessage, setResetErrorMessage] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
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
                setResendMessage(response.data.message || t('login:resend.success'));
                setErrorMessage('');
                setIsEmailNotVerified(false);
            }
        } catch (error) {
            if (error.response) {
                setResendMessage(error.response.data.message || t('login:resend.failed'));
            } else {
                setResendMessage(t('login:resend.tryAgain'));
            }
        } finally {
            setIsResending(false);
        }
    };

    const handleOpenForgotPasswordDialog = () => {
        setOpenForgotPasswordDialog(true);
        setForgotPasswordEmail('');
        setResetErrorMessage('');
    };

    const handleCloseForgotPasswordDialog = () => {
        setOpenForgotPasswordDialog(false);
        setForgotPasswordEmail('');
        setResetErrorMessage('');
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleForgotPasswordSubmit = async (event) => {
        event.preventDefault();

        if (!forgotPasswordEmail) {
            setResetErrorMessage(t('login:forgotPasswordDialog.emailRequired'));
            return;
        }

        if (!isValidEmail(forgotPasswordEmail)) {
            setResetErrorMessage(t('login:forgotPasswordDialog.invalidEmail'));
            return;
        }

        try {
            setIsSendingReset(true);
            setResetErrorMessage('');

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/password-reset/request`, 
                { email: forgotPasswordEmail }
            );

            if (response.data.status === 'success') {
                setSnackbarMessage(t('login:forgotPasswordDialog.success'));
                setSnackbarSeverity('success');
                setOpenSnackbar(true);
                setIsSendingReset(false);
                handleCloseForgotPasswordDialog();
            }
        } catch (error) {
            setIsSendingReset(false);
            if (error.response) {
                if (error.response.status === 404) {
                    setResetErrorMessage(t('login:forgotPasswordDialog.userNotFound'));
                } else if (error.response.status === 400) {
                    setResetErrorMessage(t('login:forgotPasswordDialog.emailRequired'));
                } else {
                    setResetErrorMessage(t('login:forgotPasswordDialog.error'));
                }
            } else {
                setResetErrorMessage(t('login:forgotPasswordDialog.connectionError'));
            }
        }
    };

    const handleEmailChange = (e) => {
        setForgotPasswordEmail(e.target.value);
        if (resetErrorMessage) setResetErrorMessage('');
    };

    const handleSnackbarClose = (_, reason) => {
        if (reason === 'clickaway') return;
        setOpenSnackbar(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const loginData = {
            username: data.get('username'),
            password: data.get('password'),
            rememberMe: rememberMe
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
                if (error.response.status === 403) {
                    setIsEmailNotVerified(true);
                    setEmailOrUsername(loginData.username);
                    setErrorMessage(error.response.data.message || t('login:errors.emailNotVerified'));
                } else {
                    setIsEmailNotVerified(false);
                    setErrorMessage(error.response.data.message || t('login:errors.defaultError'));
                }
            } else if (error.request) {
                setIsEmailNotVerified(false);
                setErrorMessage(t('login:errors.serverError'));
            } else {
                setIsEmailNotVerified(false);
                setErrorMessage(t('login:errors.unexpectedError'));
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
                        {t('login:title')}
                    </Typography>
                    <Box component="form" noValidate onSubmit={handleSubmit} sx={{mt: 1}}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label={t('login:username')}
                            name="username"
                            autoComplete="username"
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label={t('login:password')}
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            tabIndex={-1}
                                            aria-label={t('login:aria.togglePassword')}
                                            onClick={() => setShowPassword(true)}
                                            onMouseDown={() => setShowPassword(false)}
                                        >
                                            {showPassword ? <VisibilityOff/> : <Visibility/>}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label={t('login:rememberMe')}
                            />
                            <Link
                                component="button"
                                type="button"
                                variant="body2"
                                onClick={handleOpenForgotPasswordDialog}
                                sx={{ 
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    '&:hover': {
                                        textDecoration: 'underline'
                                    }
                                }}
                            >
                                {t('login:forgotPassword')}
                            </Link>
                        </Box>
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
                                    loading={isResending}
                                    onClick={handleResendVerification}
                                    fullWidth
                                    variant="outlined"
                                    color="warning"
                                    sx={{ mb: 2 }}
                                >
                                    {t('login:resend.button')}
                                </Button>
                            </Box>
                        )}

                        {resendMessage && (
                            <Alert
                                severity={resendMessage.toLowerCase().includes(t('login:successWord').toLowerCase()) ? 'success' : 'error'}
                                sx={{ mt: 2, mb: 2 }}
                            >
                                {resendMessage}
                            </Alert>
                        )}

                        <Button
                            loading={isLoading}
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{mt: 3, mb: 2}}
                        >
                            {t('login:loginButton')}
                        </Button>
                        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
                            {t('login:noAccount')}{' '}
                            <Link
                                component="button"
                                type="button"
                                variant="body2"
                                onClick={() => navigate('/sign-up')}
                                sx={{ cursor: 'pointer' }}
                            >
                                {t('login:signUp')}
                            </Link>

                        </Typography>
                    </Box>
                    <Copyright />
                </Box>
            </Grid>

                        <Dialog
                            open={openForgotPasswordDialog}
                            onClose={handleCloseForgotPasswordDialog}
                            disableRestoreFocus={true}
                            PaperProps={{
                                component: 'form',
                                onSubmit: handleForgotPasswordSubmit,
                                sx: { backgroundImage: 'none' },
                            }}
                        >
                            <DialogTitle>{t('login:forgotPasswordDialog.title')}</DialogTitle>
                            <DialogContent
                                sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
                            >
                                <DialogContentText sx={{ mb: 1 }}>
                                    {t('login:forgotPasswordDialog.description')}
                                </DialogContentText>
                                {resetErrorMessage && (
                                    <Alert severity="error" sx={{ mb: 1 }}>
                                        {resetErrorMessage}
                                    </Alert>
                                )}
                                <OutlinedInput
                                    autoFocus
                                    required
                                    margin="dense"
                                    id="reset-email"
                                    name="email"
                                    placeholder={t('login:forgotPasswordDialog.emailPlaceholder')}
                                    type="email"
                                    fullWidth
                                    value={forgotPasswordEmail}
                                    onChange={handleEmailChange}
                                    error={!!resetErrorMessage}
                                />
                            </DialogContent>
                            <DialogActions sx={{ pb: 3, px: 3 }}>
                                <Button onClick={handleCloseForgotPasswordDialog} disabled={isSendingReset}>
                                    {t('login:forgotPasswordDialog.cancel')}
                                </Button>
                                <Button 
                                    variant="contained" 
                                    type="submit"
                                    loading={isSendingReset}
                                    color="primary"
                                >
                                    {t('login:forgotPasswordDialog.send')}
                                </Button>
                            </DialogActions>
                        </Dialog>

                        <Snackbar
                            open={openSnackbar}
                            autoHideDuration={5000}
                            onClose={handleSnackbarClose}
                            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                        >
                            <Alert 
                                severity={snackbarSeverity} 
                                elevation={0}
                                sx={{
                                    width: '100%',
                                    backgroundColor: snackbarSeverity === 'success' ? '#4caf50' : '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 2,
                                    '& .MuiAlert-icon': {
                                        color: 'white'
                                    }
                                }}
                            >
                                {snackbarMessage}
                            </Alert>
                        </Snackbar>
        </Grid>
    );
}
