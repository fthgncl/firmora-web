import React from 'react';
import CompanyList from "../components/CompanyList";
import AccountList from "../components/AccountList";
import PeendingTransfers from "../components/PeendingTransfers";

export default function HomePage() {
    return (
        <>
            <CompanyList />
            <AccountList />
            <PeendingTransfers />
        </>
    );
}