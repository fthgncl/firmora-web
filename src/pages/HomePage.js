import React, {useRef} from 'react';
import CompanyList from "../components/CompanyList";
import AccountList from "../components/AccountList";
import PeendingTransfers from "../components/PeendingTransfers";
import QRInfoBanner from "../components/QRInfoBanner";

export default function HomePage() {
    const accountListRef = useRef();

    const handleTransferUpdated = () => {
        if (accountListRef.current?.refreshAccounts) {
            accountListRef.current.refreshAccounts();
        }
    };

    return (
        <>
            <QRInfoBanner />
            <PeendingTransfers onTransferUpdated={handleTransferUpdated} />
            <CompanyList />
            <AccountList ref={accountListRef} />
        </>
    );
}