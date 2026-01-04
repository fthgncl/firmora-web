import React, {useRef} from 'react';
import CompanyList from "../components/CompanyList";
import AccountList from "../components/AccountList";
import PeendingTransfers from "../components/PeendingTransfers";
import QRInfoBanner from "../components/QRInfoBanner";
import Divider from '@mui/material/Divider';

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
            <Divider/>
            <PeendingTransfers onTransferUpdated={handleTransferUpdated} />
            <Divider/>
            <CompanyList />
            <Divider/>
            <AccountList ref={accountListRef} />
        </>
    );
}