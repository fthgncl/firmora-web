import React from "react";
import {
    Container,
    Paper,
    Box,
    Typography,
    Avatar,
    Button,
    useTheme,
    Stack,
    Alert
} from "@mui/material";
import {CloudOff, CloudQueue, Warning, CheckCircle} from "@mui/icons-material";
import {useTranslation} from "react-i18next";
import {useAuth} from "../contexts/AuthContext";

export default function GoogleBackupBanner() {
    const {user} = useAuth();
    const theme = useTheme();
    const {t} = useTranslation(['common']);

    const handleEnableBackup = () => {
        const authUrl = process.env.REACT_APP_GOOGLE_BACKUP_AUTH_URL;
        if (authUrl) {
            window.location.href = authUrl;
        }
    };

    // backup_info yoksa hiçbir şey gösterme
    if (!user?.backup_info) return null;

    const {lastSuccessfulBackup, lastFailedBackup, googleBackup} = user.backup_info;

    // Hiçbir durum yoksa gösterme
    if (!lastSuccessfulBackup && !lastFailedBackup && googleBackup !== false) {
        return null;
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Container maxWidth="lg">
            <Stack spacing={2} sx={{mt: {xs: 2, sm: 3}, mb: 3}}>
                {/* Başarılı yedekleme bildirimi */}
                {lastSuccessfulBackup && (
                    <Alert
                        severity="success"
                        icon={<CheckCircle/>}
                        sx={{
                            borderRadius: 2,
                            alignItems: "center",
                            "& .MuiAlert-message": {
                                width: "100%"
                            }
                        }}
                    >
                        <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 2, flexWrap: "wrap"}}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    {t('common:googleBackupBanner.lastSuccessfulBackup')}
                                </Typography>
                                <Typography variant="body2">
                                    {formatDate(lastSuccessfulBackup.created_at)} • {lastSuccessfulBackup.backup_size}
                                </Typography>
                            </Box>
                        </Box>
                    </Alert>
                )}

                {/* Başarısız yedekleme uyarısı */}
                {lastFailedBackup && (
                    <Alert
                        severity="warning"
                        icon={<Warning/>}
                        sx={{
                            borderRadius: 2,
                            alignItems: "center",
                            "& .MuiAlert-message": {
                                width: "100%"
                            }
                        }}
                    >
                        <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 2, flexWrap: "wrap"}}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    {t('common:googleBackupBanner.lastFailedBackup')}
                                </Typography>
                                <Typography variant="body2">
                                    {formatDate(lastFailedBackup.created_at)} • {lastFailedBackup.backup_size}
                                </Typography>
                            </Box>
                        </Box>
                    </Alert>
                )}

                {/* Google yedekleme devre dışı banneri */}
                {googleBackup === false && (
                    <Paper
                        elevation={0}
                        sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            p: {xs: 2, sm: 3},
                            bgcolor: theme.palette.background.default,
                            position: "relative",
                            overflow: "hidden",
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 3,
                                background:
                                    "linear-gradient(90deg, rgba(99,102,241,0.9), rgba(236,72,153,0.9))"
                            }
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: {xs: "flex-start", sm: "center"},
                                justifyContent: "space-between",
                                gap: 2,
                                flexWrap: {xs: "wrap", sm: "nowrap"}
                            }}
                        >
                            {/* Sol taraf */}
                            <Box sx={{display: "flex", alignItems: "center", gap: 1.5, minWidth: 0}}>
                                <Avatar
                                    sx={{
                                        bgcolor:
                                            theme.palette.mode === "light"
                                                ? "rgba(25,118,210,.10)"
                                                : "rgba(144,202,249,.10)",
                                        color: theme.palette.primary.main,
                                        width: 48,
                                        height: 48,
                                        border: `1px solid ${theme.palette.divider}`,
                                        flexShrink: 0
                                    }}
                                >
                                    <CloudOff/>
                                </Avatar>

                                <Box sx={{minWidth: 0}}>
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight={800}
                                        sx={{
                                            lineHeight: 1.15
                                        }}
                                    >
                                        {t('common:googleBackupBanner.title')}
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            opacity: 0.75,
                                            mt: 0.3,
                                            maxWidth: 520
                                        }}
                                    >
                                        {t('common:googleBackupBanner.description')}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Sağ taraf */}
                            <Button
                                variant="contained"
                                startIcon={<CloudQueue/>}
                                onClick={handleEnableBackup}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                    fontWeight: 700,
                                    px: 2.5,
                                    py: 1.1,
                                    boxShadow: "none",
                                    "&:hover": {boxShadow: 3},
                                    flexShrink: 0
                                }}
                            >
                                {t('common:googleBackupBanner.buttonText')}
                            </Button>
                        </Box>
                    </Paper>
                )}
            </Stack>
        </Container>
    );
}
