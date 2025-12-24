import React, { useEffect, useState } from 'react';
import {useAuth} from "../contexts/AuthContext";
import TurnstileQR from "../components/TurnstileQRCode";
import {jwtDecode} from "jwt-decode";
import {useTranslation} from "react-i18next";
import {
    Box,
    Container,
    Paper,
    Typography,
    Divider,
    Avatar,
    Stack,
    Card,
    CardContent,
    useTheme,
    alpha,
    LinearProgress
} from '@mui/material';
import {
    Business as BusinessIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    QrCode2 as QrCodeIcon
} from '@mui/icons-material';

const TurnstilePage = () => {

    const { logout } = useAuth();
    const {t} = useTranslation(['common', 'turnstile']);
    const theme = useTheme();
    const [tokenInfo, setTokenInfo] = useState(null);
    const [tokenError, setTokenError] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Turnike modunda kullanıcı cihazı bırakıp gideceği için çıkış yapılıyor
        logout(false);
        // eslint-disable-next-line

        try {
            const token = getTurnstileToken();
            if (token) {
                const decodedToken = jwtDecode(token);
                setTokenInfo(decodedToken);
            } else {
                setTokenError(true);
            }
        } catch (error) {
            console.error('Token decode error:', error);
            setTokenError(true);
        }

       // eslint-disable-next-line
    }, []);

    useEffect(() => {
        const refreshInterval = parseInt(process.env.REACT_APP_TURNSTILE_QR_REFRESH_INTERVAL_MS);
        const updateInterval = 150; // Progress güncelleme sıklığı (ms)

        setProgress(0);

        const timer = setInterval(() => {
            setProgress((prevProgress) => {
                const increment = (updateInterval / refreshInterval) * 100;
                const newProgress = prevProgress + increment;

                if (newProgress >= 100) {
                    return 100; // Reset progress when complete
                }
                return newProgress;
            });
        }, updateInterval);

        return () => clearInterval(timer);
    }, []);

    const getTurnstileToken = () => sessionStorage.getItem('turnstile_token');

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        return new Date(timestamp * 1000).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (tokenError) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default'
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        maxWidth: 400
                    }}
                >
                    <Typography variant="h5" color="error" gutterBottom>
                        {t('turnstile:errors.tokenError')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('turnstile:invalidOrMissingToken')}
                    </Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                py: 4
            }}
        >
            <Container maxWidth="md">
                <Stack spacing={3}>
                    {/* Header Section */}
                    <Paper
                        elevation={2}
                        sx={{
                            p: 3,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            color: 'white'
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center" >
                            <Avatar
                                sx={{
                                    bgcolor: 'white',
                                    color: theme.palette.primary.main,
                                    width: 56,
                                    height: 56
                                }}
                            >
                                <BusinessIcon fontSize="large" />
                            </Avatar>
                            <Box>
                                <Typography
                                    variant="h4"
                                    fontWeight="bold"
                                    lineHeight={1}
                                >
                                    {tokenInfo?.company?.company_name || t('common:loading')}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                    {t('turnstile:accessControlSystem')}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>

                    {/* QR Code Section */}
                    <Card
                        elevation={3}
                        sx={{
                            position: 'relative',
                            overflow: 'visible'
                        }}
                    >
                        <CardContent sx={{ p: 4 }}>
                            <Stack spacing={3} alignItems="center">
                                <Box sx={{ textAlign: 'center' }}>
                                    <QrCodeIcon
                                        sx={{
                                            fontSize: 48,
                                            color: theme.palette.primary.main,
                                            mb: 1
                                        }}
                                    />
                                    <Typography variant="h5" fontWeight="600" gutterBottom>
                                        {t('turnstile:scanQRCode')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('turnstile:scanQRCodeDescription')}
                                    </Typography>
                                </Box>

                                {/* QR Code Display */}
                                <Box
                                    sx={{
                                        p: 3,
                                        bgcolor: 'white',
                                        borderRadius: 3,
                                        border: `4px solid ${theme.palette.primary.main}`,
                                        boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.1)}`,
                                        position: 'relative',
                                        animation: 'pulse 2s ease-in-out infinite',
                                        '@keyframes pulse': {
                                            '0%, 100%': {
                                                boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.1)}`
                                            },
                                            '50%': {
                                                boxShadow: `0 0 0 12px ${alpha(theme.palette.primary.main, 0.2)}`
                                            }
                                        }
                                    }}
                                >
                                    <TurnstileQR
                                        turnstileToken={getTurnstileToken()}
                                        size={300}
                                        handleUpdateQr={() => setProgress(0)}
                                    />
                                </Box>

                                <Box sx={{ width: '100%', maxWidth: 400 }}>
                                    <Stack spacing={1}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <ScheduleIcon fontSize="small" />
                                                {t('turnstile:qrCodeRefreshing')}
                                            </Typography>
                                            <Typography variant="caption" fontWeight="600" color="primary">
                                                {Math.round(progress)}%
                                            </Typography>
                                        </Stack>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={progress}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: 4,
                                                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
                                                }
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary" textAlign="center">
                                            {t('turnstile:nextRefresh', {
                                                seconds: Math.ceil((100 - progress) / 100 * (parseInt(process.env.REACT_APP_TURNSTILE_QR_REFRESH_INTERVAL_MS || 60000) / 1000))
                                            })}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Info Section */}
                    {tokenInfo && (
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography
                                variant="h6"
                                gutterBottom
                                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                            >
                                <PersonIcon /> {t('turnstile:sessionInfo')}
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Stack direction="row" spacing={3} flexWrap="wrap">
                                <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {t('turnstile:authorizedPerson')}
                                    </Typography>
                                    <Typography variant="body1" fontWeight="500">
                                        {tokenInfo.createdBy?.name} {tokenInfo.createdBy?.surname}
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {t('turnstile:createdAt')}
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatDate(tokenInfo.iat)}
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {t('turnstile:expiresAt')}
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatDate(tokenInfo.exp)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </Container>
        </Box>
    );
};

export default TurnstilePage;
