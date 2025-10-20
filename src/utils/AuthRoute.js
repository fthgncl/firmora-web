import {Navigate, useLocation, useParams} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {useEffect, useState} from "react";
import {permissionsService} from "../services/permissionsService";
import Unauthorized from '../pages/Unauthorized';

const AuthRoute = ({
                       children,
                       guest,
                       requireAuth = false,
                       requireGuest = false,
                       redirectTo = "/",
                       requireRoles = []
                   }) => {

    const {user, token} = useAuth();
    const {companyId} = useParams();
    const isAuthenticated = Boolean(user);
    const location = useLocation();
    const [hasPermission, setHasPermission] = useState(null);

    useEffect(() => {

        if (requireRoles.length === 0) {
            setHasPermission(true);
            return;
        }

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
                console.log('permissionResult',permissionResult);
                setHasPermission(permissionResult);
            } catch {
                setHasPermission(false);
            }
        };
        checkPermission();

        // eslint-disable-next-line
    }, [user, token, companyId]);

    if (hasPermission === false) {
        return <Unauthorized />;
    }

    if (hasPermission === null) {
        return null;
    }

    // Giriş yapmış kullanıcıların girmemesi gereken sayfalar (guest sayfalar)
    if (requireGuest && isAuthenticated) {
        // Eğer sign-in sayfasındaysa ve location.state'de from bilgisi varsa, oraya yönlendir
        if (location.pathname === '/sign-in' && location.state?.from) {
            return <Navigate to={location.state.from} replace/>;
        }
        return <Navigate to={redirectTo} replace/>;
    }

    // Giriş yapmamış kullanıcıların girmemesi gereken sayfalar (protected sayfalar)
    if (requireAuth && !isAuthenticated) {
        // Giriş yaptıktan sonra tekrar bu sayfaya dönmek için state ile location bilgisi gönder
        return <Navigate
            to="/sign-in"
            state={{from: location.pathname + location.search}}
            replace
        />;
    }

    // Eski API desteği için (mevcut kodunuzla uyumlu olması için)
    if (guest && isAuthenticated) {
        return <Navigate to={redirectTo} replace/>;
    }

    return children || guest;
};

export default AuthRoute;
