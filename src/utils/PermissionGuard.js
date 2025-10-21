import {useEffect, useState} from "react";
import {useAuth} from "../contexts/AuthContext";
import {permissionsService} from "../services/permissionsService";

/**
 * Component seviyesinde yetki kontrolü sağlar
 * @param {React.ReactNode} children - Yetkisi varsa gösterilecek component
 * @param {string[]} requireRoles - Gerekli roller listesi
 * @param {string} companyId - Firma ID'si
 * @param {React.ReactNode} fallback - Yetkisi yoksa gösterilecek component (opsiyonel)
 */
const PermissionGuard = ({children, companyId, requireRoles = [], fallback = null}) => {
    const {user, token} = useAuth();
    const [hasPermission, setHasPermission] = useState(null);

    useEffect(() => {
        // Eğer rol gereksinimi yoksa direkt izin ver
        if (requireRoles.length === 0) {
            setHasPermission(true);
            return;
        }

        // Kullanıcı, token veya companyId yoksa izin verme
        if (!companyId || !user || !token) {
            setHasPermission(false);
            return;
        }

        const checkPermission = async () => {
            try {
                const permissionResult = await permissionsService.checkUserRoles(
                    token,
                    user,
                    companyId,
                    requireRoles
                );
                setHasPermission(permissionResult);
            } catch {
                setHasPermission(false);
            }
        };

        checkPermission();
    }, [user, token, companyId, requireRoles]);

    // Permission kontrolü devam ederken loading state
    if (hasPermission === null) {
        return null;
    }

    // Yetkisi yoksa fallback veya null döndür
    if (hasPermission === false) {
        return fallback;
    }

    // Yetkisi varsa children'ı render et
    return children;
};

export default PermissionGuard;
