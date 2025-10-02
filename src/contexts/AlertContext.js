import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

const AlertContext = createContext();

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert hook must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);

    const showAlert = (message, severity = 'info', title = null, duration = 4000) => {
        const id = Date.now() + Math.random();
        const newAlert = {
            id,
            message,
            severity,
            title,
            duration,
            open: true
        };

        setAlerts(prev => [...prev, newAlert]);

        // Otomatik kapanma
        if (duration > 0) {
            setTimeout(() => {
                hideAlert(id);
            }, duration);
        }

        return id;
    };

    const hideAlert = (id) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    const clearAllAlerts = () => {
        setAlerts([]);
    };

    // Kısayol metodları
    const showSuccess = (message, title = null, duration = 4000) =>
        showAlert(message, 'success', title, duration);

    const showError = (message, title = null, duration = 6000) =>
        showAlert(message, 'error', title, duration);

    const showWarning = (message, title = null, duration = 5000) =>
        showAlert(message, 'warning', title, duration);

    const showInfo = (message, title = null, duration = 4000) =>
        showAlert(message, 'info', title, duration);

    return (
        <AlertContext.Provider value={{
            showAlert,
            showSuccess,
            showError,
            showWarning,
            showInfo,
            hideAlert,
            clearAllAlerts
        }}>
            {children}

            {/* Alert Renderer */}
            {alerts.map((alert, index) => (
                <Snackbar
                    key={alert.id}
                    open={alert.open}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center'
                    }}
                    sx={{
                        mt: index * 7, // Birden fazla alert için üst üste sıralama
                    }}
                    onClose={() => hideAlert(alert.id)}
                >
                    <Alert
                        severity={alert.severity}
                        onClose={() => hideAlert(alert.id)}
                        variant="filled"
                        sx={{
                            minWidth: '300px',
                            boxShadow: 3,
                            '& .MuiAlert-icon': {
                                fontSize: '1.2rem'
                            }
                        }}
                    >
                        {alert.title && (
                            <AlertTitle sx={{ fontWeight: 600 }}>
                                {alert.title}
                            </AlertTitle>
                        )}
                        {alert.message}
                    </Alert>
                </Snackbar>
            ))}
        </AlertContext.Provider>
    );
};