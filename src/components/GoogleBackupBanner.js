import React, {useEffect} from "react";
import {
    Container,
    Paper,
    Box,
    Typography,
    Avatar,
    Button,
    useTheme
} from "@mui/material";
import {CloudOff, CloudQueue} from "@mui/icons-material";
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

    if (!('googleBackup' in user && user.googleBackup === false))
        return null;

    return (
        <Container maxWidth="lg">
            <Paper
                elevation={0}
                sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    p: {xs: 2, sm: 3},
                    mt: {xs: 2, sm: 3},
                    mb: 3,
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
                        gap: 2
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
                                    lineHeight: 1.15,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis"
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
                            "&:hover": {boxShadow: 3}
                        }}
                    >
                        {t('common:googleBackupBanner.buttonText')}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
