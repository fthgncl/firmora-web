import * as React from 'react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

function ForgotPasswordDialog({ open, handleClose }) {
    const { t } = useTranslation(['login']);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!email) {
            setErrorMessage(t('login:forgotPasswordDialog.errors.emailRequired'));
            return;
        }

        if (!isValidEmail(email)) {
            setErrorMessage(t('login:forgotPasswordDialog.errors.invalidEmail'));
            return;
        }

        try {
            setIsLoading(true);
            setErrorMessage('');

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/password-reset/request`, 
                { email }
            );

            if (response.data.status === 'success') {
                setSnackbarMessage(t('login:forgotPasswordDialog.success'));
                setSnackbarSeverity('success');
                setOpenSnackbar(true);
                setIsLoading(false);
                setEmail('');
                handleClose();
            }
        } catch (error) {
            setIsLoading(false);
            if (error.response) {
                if (error.response.status === 404) {
                    setErrorMessage(t('login:forgotPasswordDialog.errors.userNotFound'));
                } else if (error.response.status === 400) {
                    setErrorMessage(t('login:forgotPasswordDialog.errors.emailRequired'));
                } else {
                    setErrorMessage(t('login:forgotPasswordDialog.errors.sendFailed'));
                }
            } else {
                setErrorMessage(t('login:forgotPasswordDialog.errors.connectionError'));
            }
        }
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        if (errorMessage) setErrorMessage('');
    };

    const handleSnackbarClose = (_, reason) => {
        if (reason === 'clickaway') return;
        setOpenSnackbar(false);
    };

    const handleDialogClose = () => {
        setEmail('');
        setErrorMessage('');
        handleClose();
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={handleDialogClose}
                disableRestoreFocus={true}
                PaperProps={{
                    component: 'form',
                    onSubmit: handleSubmit,
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
                    {errorMessage && (
                        <Alert severity="error" sx={{ mb: 1 }}>
                            {errorMessage}
                        </Alert>
                    )}
                    <OutlinedInput
                        autoFocus
                        required
                        margin="dense"
                        id="email"
                        name="email"
                        placeholder={t('login:forgotPasswordDialog.emailPlaceholder')}
                        type="email"
                        fullWidth
                        value={email}
                        onChange={handleEmailChange}
                        error={!!errorMessage}
                        disabled={isLoading}
                    />
                </DialogContent>
                <DialogActions sx={{ pb: 3, px: 3 }}>
                    <Button onClick={handleDialogClose} disabled={isLoading}>
                        {t('login:forgotPasswordDialog.cancel')}
                    </Button>
                    <Button 
                        variant="contained" 
                        type="submit"
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        {isLoading ? t('login:forgotPasswordDialog.sending') : t('login:forgotPasswordDialog.send')}
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
        </>
    );
}

ForgotPasswordDialog.propTypes = {
    handleClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default ForgotPasswordDialog;
