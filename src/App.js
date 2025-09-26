import './css/App.css';
import {Route, Routes} from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

function App() {
    return (
        <div className="page-container">
            <Routes>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </div>
    );
}

export default App;