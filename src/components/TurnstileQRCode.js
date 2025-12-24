import {useEffect, useRef, useState} from "react";
import QrCreator from "qr-creator";
import {useAlert} from "../contexts/AlertContext";
import axios from "axios";
import {useTranslation} from "react-i18next";

function TurnstileQR({turnstileToken, handleUpdateQr , ...props}) {
    const {t} = useTranslation(['turnstile']);
    const [qrValue, setQrValue] = useState("");
    const qrRef = useRef(null);
    const {showAlert} = useAlert();

    // Token çek
    useEffect(() => {
        if (!turnstileToken) return;

        const updateQR = async () => {
            try {
                const res = await axios.get(
                    `${process.env.REACT_APP_API_URL}/turnstile/get-token/${turnstileToken}`
                );

                if (res.data.status === "success" && res.data.token) {
                    setQrValue(res.data.token);
                    handleUpdateQr();
                } else {
                    showAlert(res.data.message || t('turnstile:tokenError'), "error");
                }
            } catch (error) {
                showAlert(error.response?.data?.message || t('turnstile:tokenError'), "error");
            }
        };

        updateQR();
        const interval = setInterval(updateQR, process.env.REACT_APP_TURNSTILE_QR_REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);

        // eslint-disable-next-line
    }, [turnstileToken, showAlert]);

    // QR render et
    useEffect(() => {
        if (!qrRef.current) return;
        if (!qrValue) return;

        qrRef.current.innerHTML = ""; // eski QR'ı temizle

        QrCreator.render(
            {
                text: qrValue,
                size: 220,
                ecLevel: "H",
                fill: "#000",
                background: "#fff",
                ...props

            },
            qrRef.current
        );
    }, [props, qrValue]);

    if (!turnstileToken) return null;

    return <div ref={qrRef}/>;
}

export default TurnstileQR;
