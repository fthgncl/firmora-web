import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Stack,
    Typography,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import {useTranslation} from "react-i18next";

const REGION_ID = "qr-region";

function pickBestCameraId(devices = []) {
    // Arka kamera için yaygın isimler
    const preferred = devices.find(d =>
        /back|rear|environment/i.test(d.label || "")
    );
    return (preferred || devices[0])?.id || null;
}

export default function TurnstileScanUI({ onScan }) {
    const qrRef = useRef(null);
    const { t } = useTranslation(['turnstile']);
    const [status, setStatus] = useState("idle"); // idle | requesting | running | stopped | error
    const [message, setMessage] = useState("");
    const [permission, setPermission] = useState("unknown"); // unknown | granted | denied | prompt
    const [deviceCount, setDeviceCount] = useState(0);

    const isRunning = status === "running";
    const isBusy = status === "requesting";

    const stopScanner = useCallback(async () => {
        try {
            if (qrRef.current) {
                // stop() only if started
                await qrRef.current.stop().catch(() => {});
                await qrRef.current.clear().catch(() => {});
            }
        } finally {
            setStatus("stopped");
        }
    }, []);

    const requestCameraPermission = useCallback(async () => {
        // 1) Permission API ile durum oku (her tarayıcı desteklemeyebilir)
        try {
            if (navigator.permissions?.query) {
                const p = await navigator.permissions.query({ name: "camera" });
                setPermission(p.state); // granted/denied/prompt
                p.onchange = () => setPermission(p.state);
            }
        } catch {
            // yoksa sorun değil
        }

        // 2) İzni gerçekten tetikleyen çağrı (popup açtırır)
        setStatus("requesting");
        setMessage("");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false,
            });
            // hemen kapat (sadece izin almak için açtık)
            stream.getTracks().forEach(t => t.stop());
            setPermission("granted");
            setStatus("idle");
            return true;
        } catch (e) {
            setPermission("denied");
            setStatus("error");
            setMessage(
                t('turnstile:scan.cameraPermissionDenied')
            );
            return false;
        }
        // eslint-disable-next-line
    }, []);

    const startScanner = useCallback(async () => {
        setMessage("");

        // HTTPS / localhost kontrolü (kamera çoğu tarayıcıda secure context ister)
        if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
            setStatus("error");
            setMessage(t('turnstile:scan.httpsRequired'));
            return;
        }

        // İzin yoksa iste
        if (permission !== "granted") {
            const ok = await requestCameraPermission();
            if (!ok) return;
        }

        // Cihazları listele
        let devices = [];
        try {
            devices = await Html5Qrcode.getCameras();
            setDeviceCount(devices.length);
        } catch {
            setStatus("error");
            setMessage(t('turnstile:scan.cameraNotAccessible'));
            return;
        }

        if (!devices.length) {
            setStatus("error");
            setMessage(t('turnstile:scan.cameraNotFound'));
            return;
        }

        const cameraId = pickBestCameraId(devices);

        // Scanner init
        if (!qrRef.current) {
            qrRef.current = new Html5Qrcode(REGION_ID);
        }

        setStatus("requesting");
        try {
            await qrRef.current.start(
                { deviceId: { exact: cameraId } },
                {
                    fps: 10,
                    qrbox: { width: 260, height: 260 },
                    aspectRatio: 1.0,
                    disableFlip: true,
                },
                async (decodedText) => {
                    // başarılı okutma
                    try {
                        await stopScanner();
                    } catch {}
                    onScan?.(decodedText);
                },
                () => {
                    // her frame hatasında log basmayalım
                }
            );

            setStatus("running");
            setPermission("granted");
        } catch (e) {
            setStatus("error");
            setMessage(
                t('turnstile:scan.cameraStartFailed')
            );
        }
        // eslint-disable-next-line
    }, [onScan, permission, requestCameraPermission, stopScanner]);

    // sayfa kapanırken temizle
    useEffect(() => {
        return () => {
            if (qrRef.current) {
                qrRef.current.stop().catch(() => {});
                qrRef.current.clear().catch(() => {});
            }
        };
    }, []);

    const statusChip = useMemo(() => {
        if (isRunning) return <Chip label={t('turnstile:scan.statusCameraOpen')} color="success" size="small" />;
        if (isBusy) return <Chip label={t('turnstile:scan.statusStarting')} color="warning" size="small" />;
        if (status === "error") return <Chip label={t('turnstile:scan.statusError')} color="error" size="small" />;
        return <Chip label={t('turnstile:scan.statusReady')} color="default" size="small" />;
    }, [isRunning, isBusy, status, t]);

    return (
        <Box sx={{ maxWidth: 520, mx: "auto", px: 2, py: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <QrCodeScannerIcon />
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={700}>
                                {t('turnstile:scan.title')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('turnstile:scan.description')}
                            </Typography>
                        </Box>
                        {statusChip}
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    {/* Kamera alanı */}
                    <Box
                        sx={{
                            position: "relative",
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "divider",
                            minHeight: 320,
                            bgcolor: "background.default",
                        }}
                    >
                        <Box id={REGION_ID} sx={{ width: "100%", "& video": { width: "100%" } }} />

                        {/* Overlay states */}
                        {!isRunning && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 1,
                                    p: 2,
                                    bgcolor: "rgba(0,0,0,0.04)",
                                    backdropFilter: "blur(3px)",
                                }}
                            >
                                {isBusy ? (
                                    <>
                                        <CircularProgress size={28} />
                                        <Typography variant="body2" color="text.secondary">
                                            Kamera başlatılıyor...
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        <VideocamOffIcon color="action" />
                                        <Typography variant="body2" color="text.secondary" align="center">
                                            Kamera kapalı. Başlatmak için aşağıdan “Kamerayı Aç”a basın.
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Mesajlar */}
                    {!!message && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {message}
                        </Alert>
                    )}

                    <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<CameraAltIcon />}
                            onClick={startScanner}
                            disabled={isBusy || isRunning}
                        >
                            {t('turnstile:scan.openCamera')}
                        </Button>

                        <Button
                            fullWidth
                            variant="outlined"
                            color="inherit"
                            onClick={stopScanner}
                            disabled={isBusy || !isRunning}
                        >
                            {t('turnstile:scan.stop')}
                        </Button>
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        {t('turnstile:scan.permission')}: {permission} • {t('turnstile:scan.cameraCount')}: {deviceCount || "-"}
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
