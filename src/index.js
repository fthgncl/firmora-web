import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/index.css';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {AuthProvider} from './contexts/AuthContext';
import {AppThemeProvider} from './contexts/ThemeContext';
import {AlertProvider} from './contexts/AlertContext';
import './services/i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <AuthProvider>
        <AppThemeProvider>
            <AlertProvider>
                <BrowserRouter 
                    basename={process.env.REACT_APP_BASE_PATH || ''}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <App/>
                </BrowserRouter>
            </AlertProvider>
        </AppThemeProvider>
    </AuthProvider>
);

reportWebVitals();
