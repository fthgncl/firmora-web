import React from 'react';
import CompanyList from "../components/CompanyList";
import AccountList from "../components/AccountList";
import PeendingTransfers from "../components/PeendingTransfers";
import Divider from '@mui/material/Divider';

export default function HomePage() {
    return (
        <>
            <CompanyList />
            <Divider/>
            <AccountList />
            <Divider/>
            <PeendingTransfers />
        </>
    );
}