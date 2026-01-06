import './css/App.css';
import {Route, Routes} from "react-router-dom";
import {Box, CssBaseline} from "@mui/material";
import AuthRoute from "./utils/AuthRoute";
import HomePage from "./pages/HomePage";
import SignInPage from "./pages/SignInPage";
import SignInUpPage from "./pages/SignInUpPage";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";
import CompanyPage from "./pages/CompanyPage";
import TransferDetailPage from "./pages/TransferDetailPage";
import TurnstileDisplayPage from "./pages/TurnstileDisplayPage";
import TurnstileScanPage from "./pages/TurnstileScanPage";
import ResetPassword from "./pages/ResetPassword";
import UserWorkHistoryPage from "./pages/UserWorkHistoryPage";
import WorkStatusOverviewPage from "./pages/WorkStatusOverviewPage";
import React from "react";
import AppBar from "./components/AppBar";


function App() {

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            color: 'text.primary'
        }}>
            <CssBaseline/>
            <AppBar/>
            <Routes>

                <Route path="/turnstile/display" element={<TurnstileDisplayPage/>}/>
                <Route path="/turnstile/scan" element={
                    <AuthRoute requireAuth={true} redirectTo="/sign-in">
                        <TurnstileScanPage/>
                    </AuthRoute>
                }/>

                {/* Giriş yapmamış kullanıcıların girebileği sayfalar */}
                <Route path="/sign-in" element={
                    <AuthRoute requireGuest={true} redirectTo="/">
                        <SignInPage/>
                    </AuthRoute>
                }/>


                <Route path="/sign-up" element={
                    <AuthRoute requireGuest={true} redirectTo="/">
                        <SignInUpPage/>
                    </AuthRoute>
                }/>

                <Route path="/verify-email/:token" element={
                    <AuthRoute requireGuest={true} redirectTo="/">
                        <VerifyEmail/>
                    </AuthRoute>
                }/>


                {/* Giriş yapmış kullanıcıların girebileği sayfalar */}
                <Route path="/" element={
                    <AuthRoute requireAuth={true} redirectTo="/sign-in">
                        <HomePage/>
                    </AuthRoute>
                }/>

                <Route path="/company/:companyId" element={
                    <AuthRoute
                        requireAuth={true}
                        redirectTo="/sign-in"
                        requireRoles={[
                            "sys_admin",
                            "personnel_manager",
                            "can_transfer_company_to_same_company_user",
                            "can_transfer_company_to_other_company_user",
                            "can_transfer_company_to_other_company",
                            "can_transfer_company_to_external",
                            "can_receive_external_to_company",
                            "can_view_company_transfer_history",
                            "can_view_other_users_transfer_history",
                            "can_act_as_turnstile",
                            "can_view_user_work_status"
                        ]}>
                        <CompanyPage/>
                    </AuthRoute>
                }/>

                <Route path="/transfer/:transferId" element={
                    <AuthRoute requireAuth={true} redirectTo="/sign-in">
                        <TransferDetailPage/>
                    </AuthRoute>
                }/>

                <Route path="/company/:companyId/work-history" element={
                    <AuthRoute
                        requireAuth={true}
                        redirectTo="/sign-in"
                        requireRoles={['can_view_user_work_status']}>
                        <WorkStatusOverviewPage/>
                    </AuthRoute>
                }/>

                <Route path="/company/:companyId/user/:userId/work-history" element={
                    <AuthRoute requireAuth={true} redirectTo="/sign-in">
                        <UserWorkHistoryPage/>
                    </AuthRoute>
                }/>

                {/* Herkesin girebileği sayfalar */}
                <Route path="/reset-password/:token" element={<ResetPassword/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </Box>
    );
}

export default App;