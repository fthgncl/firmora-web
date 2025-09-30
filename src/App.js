import './css/App.css';
import {Route, Routes} from "react-router-dom";
import AuthRoute from "./utils/AuthRoute";
import HomePage from "./pages/HomePage";
import SignInPage from "./pages/SignInPage";
import NotFound from "./pages/NotFound";

function App() {
    return (
        <div className="page-container">
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
        </div>
    );
}

export default App;