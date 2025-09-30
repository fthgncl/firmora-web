import './css/App.css';
import {Route, Routes} from "react-router-dom";
import {Box, CssBaseline} from "@mui/material";
import AuthRoute from "./utils/AuthRoute";
import HomePage from "./pages/HomePage";
import SignInPage from "./pages/SignInPage";
import NotFound from "./pages/NotFound";
import { AlertProvider } from "./contexts/AlertContext";

function App() {
    return (
        <AlertProvider>
            <Box sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                color: 'text.primary'
            }}>
                <CssBaseline />
                <Routes>

                    {/* Giriş yapmamış kullanıcıların girebileği sayfalar */}
                    <Route path="/sign-in" element={
                        <AuthRoute requireGuest={true} redirectTo="/">
                            <SignInPage/>
                        </AuthRoute>
                    }/>

                    {/* Giriş yapmış kullanıcıların girebileği sayfalar */}
                    <Route path="/" element={
                        <AuthRoute requireAuth={true} redirectTo="/sign-in">
                            <HomePage/>
                        </AuthRoute>
                    }/>

                    {/* Herkesin girebileği sayfalar */}
                    <Route path="*" element={<NotFound/>}/>
                </Routes>
            </Box>
        </AlertProvider>
    );
}

export default App;