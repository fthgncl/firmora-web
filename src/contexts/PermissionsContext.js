// src/contexts/PermissionsContext.js
import React, { createContext, useContext } from 'react';
import { usePermissions as usePermissionsHook } from '../hooks/usePermissions';

const PermissionsContext = createContext(null);

export const PermissionsProvider = ({ children }) => {
    const permissionsData = usePermissionsHook();

    return (
        <PermissionsContext.Provider value={permissionsData}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => {
    const context = useContext(PermissionsContext);
    if (!context) {
        throw new Error('usePermissions must be used within PermissionsProvider');
    }
    return context;
};

export default PermissionsContext;
