import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { permissionsService } from '../services/permissionsService';
import i18n from '../services/i18n';

const t = (k) => i18n.t(`permissionsHook:${k}`);

/**
 * Yetki yönetimi için custom hook
 */
export const usePermissions = () => {
    const { token } = useAuth();
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadPermissions = useCallback(async () => {
        if (!token) {
            setPermissions(null);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await permissionsService.getPermissions(token);
            setPermissions(data);
        } catch (err) {
            console.error(t('logs.loadError'), err);
            setError(err.message || t('errors.fetchFailedDefault'));
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadPermissions();
    }, [loadPermissions]);

    const refreshPermissions = useCallback(() => {
        permissionsService.clearPermissionsCache();
        loadPermissions();
    }, [loadPermissions]);

    const decodePermissions = useCallback(
        async (permissionString) => {
            if (!token) return [];
            return await permissionsService.decodePermissionString(token, permissionString);
        },
        [token]
    );

    const encodePermissions = useCallback(
        async (permissionKeys) => {
            if (!token) return '';
            return await permissionsService.encodePermissionKeys(token, permissionKeys);
        },
        [token]
    );

    const hasPermission = useCallback(
        (permissionKey) => {
            return permissions && permissions[permissionKey] !== undefined;
        },
        [permissions]
    );

    const getPermissionsByCategory = useCallback(() => {
        if (!permissions) return {};

        const grouped = {};

        Object.entries(permissions).forEach(([key, value]) => {
            const category = value.category || t('unknownCategory');

            if (!grouped[category]) {
                grouped[category] = [];
            }

            grouped[category].push({
                key,
                code: value.code,
                name: value.name,
                description: value.description,
            });
        });

        return grouped;
    }, [permissions]);

    const getCacheInfo = useCallback(() => {
        return permissionsService.getCacheInfo?.(); // mevcutsa döner
    }, []);

    return {
        permissions,
        loading,
        error,
        refreshPermissions,
        decodePermissions,
        encodePermissions,
        hasPermission,
        getPermissionsByCategory,
        getCacheInfo,
    };
};

export default usePermissions;
