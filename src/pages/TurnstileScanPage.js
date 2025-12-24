import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Stack,
    TextField,
    Typography,
    Chip,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";

import QrScan from "../components/qrScan";
import {useTranslation} from "react-i18next";

const MODE = {
    ENTRY: "entry",
    EXIT: "exit",
};

export default function TurnstileScanPage() {
    const {t} = useTranslation();
    const [mode, setMode] = useState(null);
    const [note, setNote] = useState("");

    // 🔽 QR alanı için ref
    const qrSectionRef = useRef(null);

    const modeLabel = useMemo(() => {
        if (mode === MODE.ENTRY) return t("turnstile:scanPage.entry");
        if (mode === MODE.EXIT) return t("turnstile:scanPage.exit");
        return "";
    }, [mode, t]);

    const modeColor = useMemo(() => {
        if (mode === MODE.ENTRY) return "success";
        if (mode === MODE.EXIT) return "error";
        return "default";
    }, [mode]);

    const handleScan = (decodedText) => {
        console.log("Turnstile scan:", {
            mode,
            note: note?.trim() || null,
            data: decodedText,
        });
    };

    // 🔽 Seçim yapıldığında QR alanına scroll + focus
    useEffect(() => {
        if (!mode || !qrSectionRef.current) return;

        qrSectionRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        // küçük bir gecikme, render tamamlanması için
        setTimeout(() => {
            qrSectionRef.current?.focus();
        }, 300);
    }, [mode]);

    return (
        <Box sx={{ maxWidth: 560, mx: "auto", px: 2, py: 3 }}>
            <Stack spacing={2}>
                {/* ÜST KART */}
                <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Stack spacing={1.5}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" fontWeight={800}>
                                        {t("turnstile:scanPage.title")}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t("turnstile:scanPage.description")}
                                    </Typography>
                                </Box>

                                {mode ? (
                                    <Chip size="small" label={modeLabel} color={modeColor} />
                                ) : (
                                    <Chip size="small" label={t("turnstile:scanPage.waitingSelection")} />
                                )}
                            </Stack>

                            <Divider />

                            <Stack direction="row" spacing={1.5}>
                                <Button
                                    fullWidth
                                    size="large"
                                    startIcon={<LoginIcon />}
                                    variant={mode === MODE.ENTRY ? "contained" : "outlined"}
                                    color="success"
                                    onClick={() => setMode(MODE.ENTRY)}
                                    sx={{ py: 1.25, fontWeight: 800, borderRadius: 2 }}
                                >
                                    {t("turnstile:scanPage.entry")}
                                </Button>

                                <Button
                                    fullWidth
                                    size="large"
                                    startIcon={<LogoutIcon />}
                                    variant={mode === MODE.EXIT ? "contained" : "outlined"}
                                    color="error"
                                    onClick={() => setMode(MODE.EXIT)}
                                    sx={{ py: 1.25, fontWeight: 800, borderRadius: 2 }}
                                >
                                    {t("turnstile:scanPage.exit")}
                                </Button>
                            </Stack>

                            <TextField
                                label={t("turnstile:scanPage.noteLabel")}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                fullWidth
                                size="small"
                            />
                        </Stack>
                    </CardContent>
                </Card>

                {/* 🔽 QR SCAN BÖLÜMÜ */}
                {mode && (
                    <Box
                        ref={qrSectionRef}
                        tabIndex={-1} // focus alabilmesi için
                        sx={{ outline: "none" }}
                    >
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {mode === MODE.ENTRY
                                ? t("turnstile:scanPage.scanForEntry")
                                : t("turnstile:scanPage.scanForExit")}
                        </Typography>

                        <QrScan onScan={handleScan} />
                    </Box>
                )}
            </Stack>
        </Box>
    );
}
