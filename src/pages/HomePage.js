import React from 'react';
import CompanyList from "../components/CompanyList";
import AccountList from "../components/AccountList";

export default function HomePage() {
    return (
        <>
            <CompanyList />
            <AccountList />
        </>
    );
}