import React from "react";
import {
    Container,
    Paper,
    Box,
    Typography,
    Avatar,
    Button,
    useTheme
} from "@mui/material";
import {QrCodeScanner, InfoOutlined} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

export default function TurnstileScanBanner({to = "/turnstile/scan"}) {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation(['turnstile']);

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
                            <InfoOutlined/>
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
                                {t('turnstile:qrInfoBanner.title')}
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
                                {t('turnstile:qrInfoBanner.description')}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Sağ taraf */}
                    <Button
                        variant="contained"
                        startIcon={<QrCodeScanner/>}
                        onClick={() => navigate(to)}
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
                        {t('turnstile:qrInfoBanner.buttonText')}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
