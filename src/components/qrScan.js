import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Html5Qrcode} from "html5-qrcode";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    MenuItem,
    Select,
    Stack,
    Typography,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CameraswitchIcon from "@mui/icons-material/Cameraswitch";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import StopIcon from "@mui/icons-material/Stop";
import {useTranslation} from "react-i18next";

const REGION_ID = "turnstile-qr-region";

function isMobileDevice() {
    // Desktop’ta kamera seçimi, mobile’da ön/arka toggle mantığı için pratik ayrım
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function pickBackCameraId(devices = []) {
    // Permission alındıktan sonra label dolabilir. Arka kamerayı etiketlerden yakalamaya çalışırız.
    const back = devices.find((d) => /back|rear|environment/i.test(d.label || ""));
    return (back || devices[0])?.id || null;
}

export default function TurnstileScanUI({onScan}) {
    const {t} = useTranslation();
    const qrRef = useRef(null);

    const [status, setStatus] = useState("idle"); // idle | requesting | running | stopped | error
    const [message, setMessage] = useState("");
    const [permission, setPermission] = useState("unknown"); // unknown | granted | denied | prompt

    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState("");
    const [mobileFacingMode, setMobileFacingMode] = useState("environment"); // environment (back) | user (front)

    const mobile = useMemo(() => isMobileDevice(), []);
    const isRunning = status === "running";
    const isBusy = status === "requesting";

    const safeCatch = async (maybePromise) => {
        if (maybePromise && typeof maybePromise.catch === "function") {
            await maybePromise.catch(() => {
            });
        }
    };

    const stopScanner = useCallback(async () => {
        try {
            if (qrRef.current) {
                await safeCatch(qrRef.current.stop?.());
                await safeCatch(qrRef.current.clear?.());
            }
        } finally {
            setStatus("stopped");
        }
    }, []);

    const requestCameraPermission = useCallback(async () => {
        // Permission API (varsa) sadece durumu okumaya yarar
        try {
            if (navigator.permissions?.query) {
                const p = await navigator.permissions.query({name: "camera"});
                setPermission(p.state);
                p.onchange = () => setPermission(p.state);
            }
        } catch {
            // ignore
        }

        // Asıl izin penceresini açan şey:
        setStatus("requesting");
        setMessage("");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {facingMode: "environment"},
                audio: false,
            });
            stream.getTracks().forEach((t) => t.stop());

            setPermission("granted");
            setStatus("idle");
            return true;
        } catch {
            setPermission("denied");
            setStatus("error");
            setMessage(t("turnstile:scan.cameraPermissionDenied"));
            return false;
        }
    }, [t]);

    const loadCameras = useCallback(async () => {
        try {
            const list = await Html5Qrcode.getCameras();
            setCameras(list || []);

            // Desktop: bir kere seçili kamera yoksa default ata (arka tercih)
            if (!mobile && !selectedCameraId) {
                const preferred = pickBackCameraId(list);
                if (preferred) setSelectedCameraId(preferred);
            }

            return list || [];
        } catch {
            setStatus("error");
            setMessage(t("turnstile:scan.cameraNotAccessible"));
            return [];
        }
    }, [mobile, selectedCameraId, t]);

    const startScanner = useCallback(
        async (opts = {}) => {
            const {forceRestart = false, facingModeOverride} = opts;

            setMessage("");

            // HTTPS şartı (localhost hariç)
            if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
                setStatus("error");
                setMessage(t("turnstile:scan.httpsRequired"));
                return;
            }

            // Çalışıyorsa restart istenmediyse çık
            if (isRunning && !forceRestart) return;

            // Restart ise önce durdur
            if (isRunning && forceRestart) {
                await stopScanner();
            }

            // İzin yoksa iste
            if (permission !== "granted") {
                const ok = await requestCameraPermission();
                if (!ok) return;
            }

            // Kameraları yükle
            const list = await loadCameras();
            if (!list.length) {
                setStatus("error");
                setMessage(t("turnstile:scan.cameraNotFound"));
                return;
            }

            // Scanner init
            if (!qrRef.current) {
                qrRef.current = new Html5Qrcode(REGION_ID);
            }

            setStatus("requesting");

            try {
                // Mobil: ön/arka geçiş facingMode ile (environment/user)
                // Desktop: seçili deviceId ile

                const facingToUse = facingModeOverride ?? mobileFacingMode;
                const cameraConfig = mobile
                    ? {facingMode: facingToUse}
                    : {deviceId: {exact: selectedCameraId || pickBackCameraId(list)}};

                await qrRef.current.start(
                    cameraConfig,
                    {
                        fps: 10,
                        qrbox: {width: 260, height: 260},
                        aspectRatio: 1.0,
                        disableFlip: true,
                    },
                    async (decodedText) => {
                        // okundu -> durdur ve dışarı ver
                        await stopScanner();
                        onScan?.(decodedText);
                    },
                    () => {
                        // frame hatalarını spamlamıyoruz
                    }
                );

                setStatus("running");
            } catch {
                setStatus("error");
                setMessage(t("turnstile:scan.cameraStartFailed"));
            }
        },
        [
            isRunning,
            loadCameras,
            mobile,
            mobileFacingMode,
            onScan,
            permission,
            requestCameraPermission,
            selectedCameraId,
            stopScanner,
            t,
        ]
    );

    // Component unmount cleanup
    useEffect(() => {
        return () => {
            if (qrRef.current) {
                safeCatch(qrRef.current.stop?.());
                safeCatch(qrRef.current.clear?.());
            }
        };
    }, []);

    // Desktop’ta select değişince (kamera açıksa) otomatik restart
    useEffect(() => {
        if (!mobile && isRunning && selectedCameraId) {
            startScanner({forceRestart: true});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCameraId]);

    const handleSwitchMobileCamera = async () => {
        const next = mobileFacingMode === "environment" ? "user" : "environment";
        setMobileFacingMode(next);

        if (isRunning) {
            await startScanner({ forceRestart: true, facingModeOverride: next });
        }
    };

    const statusChip = useMemo(() => {
        if (status === "running") return <Chip label={t("turnstile:scan.statusCameraOpen")} color="success"
                                               size="small"/>;
        if (status === "requesting") return <Chip label={t("turnstile:scan.statusStarting")} color="warning"
                                                  size="small"/>;
        if (status === "error") return <Chip label={t("turnstile:scan.statusError")} color="error" size="small"/>;
        return <Chip label={t("turnstile:scan.statusReady")} size="small"/>;
    }, [status, t]);

    const showDesktopDeviceSelect = !mobile && cameras.length > 1;

    const nextFacingMode = mobileFacingMode === "environment" ? "user" : "environment";
    const nextCameraText =
        nextFacingMode === "environment"
            ? t("turnstile:scan.backCamera")
            : t("turnstile:scan.frontCamera");

    return (
        <Box sx={{maxWidth: 560, mx: "auto", px: 2, py: 3}}>
            <Card sx={{borderRadius: 3}}>
                <CardContent>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <QrCodeScannerIcon/>
                        <Box sx={{flex: 1}}>
                            <Typography variant="h6" fontWeight={800}>
                                {t("turnstile:scan.title")}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t("turnstile:scan.description")}
                            </Typography>
                        </Box>
                        {statusChip}
                    </Stack>

                    <Divider sx={{my: 2}}/>

                    {/* Desktop: Kamera seçimi */}
                    {showDesktopDeviceSelect && (
                        <Stack direction={{xs: "column", sm: "row"}} spacing={1.5} sx={{mb: 2}} alignItems="center">
                            <FormControl fullWidth size="small">
                                <Select
                                    value={selectedCameraId}
                                    label={t("turnstile:scan.cameraCount")}
                                    onChange={(e) => setSelectedCameraId(e.target.value)}
                                >
                                    {cameras.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>
                                            {c.label || c.id}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Button
                                variant="outlined"
                                startIcon={<CameraAltIcon/>}
                                onClick={() => startScanner({forceRestart: true})}
                                disabled={isBusy}
                                sx={{whiteSpace: "nowrap"}}
                            >
                                {t("turnstile:scan.openCamera")}
                            </Button>
                        </Stack>
                    )}

                    {/* Kamera alanı */}
                    <Box
                        sx={{
                            position: "relative",
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "divider",
                            minHeight: 340,
                            bgcolor: "background.default",
                        }}
                    >
                        <Box id={REGION_ID} sx={{width: "100%", "& video": {width: "100%"}}}/>

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
                                    textAlign: "center",
                                }}
                            >
                                {isBusy ? (
                                    <>
                                        <CircularProgress size={28}/>
                                        <Typography variant="body2" color="text.secondary">
                                            {t("turnstile:scan.cameraStarting")}
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        <VideocamOffIcon color="action"/>
                                        <Typography variant="body2" color="text.secondary">
                                            {t("turnstile:scan.cameraOffMessage")}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        )}
                    </Box>

                    {!!message && (
                        <Alert severity="error" sx={{mt: 2}}>
                            {message}
                        </Alert>
                    )}

                    {/* Alt aksiyonlar */}
                    <Stack direction={{xs: "column", sm: "row"}} spacing={1.5} sx={{mt: 2}}>
                        {!showDesktopDeviceSelect && (
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<CameraAltIcon/>}
                                onClick={() => startScanner()}
                                disabled={isBusy || isRunning}
                            >
                                {t("turnstile:scan.openCamera")}
                            </Button>
                        )}

                        <Button
                            fullWidth
                            variant="outlined"
                            color="inherit"
                            startIcon={<StopIcon/>}
                            onClick={stopScanner}
                            disabled={isBusy || !isRunning}
                        >
                            {t("turnstile:scan.stop")}
                        </Button>

                        {/* Mobil: ön/arka değiştir */}
                        {mobile && (
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<CameraswitchIcon />}
                                onClick={handleSwitchMobileCamera}
                                disabled={isBusy}
                            >
                                {t("turnstile:scan.switchCamera")} • {nextCameraText}
                            </Button>
                        )}
                    </Stack>

                </CardContent>
            </Card>
        </Box>
    );
}
