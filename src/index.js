import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/index.css';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import {AuthProvider} from './contexts/AuthContexts';
import './services/i18n';

const theme = createTheme();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <AuthProvider>
        <ThemeProvider theme={theme}>
            <BrowserRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <App/>
            </BrowserRouter>
        </ThemeProvider>
    </AuthProvider>
);

reportWebVitals();
