import QrScan from "../components/qrScan";

export default function TurnstileScanPage(){

    const handleScan = (data) => {
        console.log("Scanned data:", data);
    }

    return <QrScan onScan={handleScan} />;
}