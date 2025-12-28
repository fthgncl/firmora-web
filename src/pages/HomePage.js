import React from 'react';
import CompanyList from "../components/CompanyList";
import AccountList from "../components/AccountList";
import PeendingTransfers from "../components/PeendingTransfers";
import QRInfoBanner from "../components/QRInfoBanner";
import Divider from '@mui/material/Divider';

export default function HomePage() {
    return (
        <>
            <QRInfoBanner />
            <Divider/>
            <PeendingTransfers />
            <Divider/>
            <CompanyList />
            <Divider/>
            <AccountList />
        </>
    );
}