import './css/App.css';
import {Route, Routes} from "react-router-dom";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";

function App() {
    return (
        <div className="page-container">
            <Routes>
                <Route path="/" element={<HomePage/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </div>
    );
}

export default App;