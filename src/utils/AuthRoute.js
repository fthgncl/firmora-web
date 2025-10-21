import {Navigate, useLocation, useParams} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import PermissionGuard from './PermissionGuard';
import Unauthorized from '../pages/Unauthorized';

const AuthRoute = ({
                       children,
                       guest,
                       requireAuth = false,
                       requireGuest = false,
                       redirectTo = "/",
                       requireRoles = []
                   }) => {

    const {user} = useAuth();
    const {companyId} = useParams();
    const isAuthenticated = Boolean(user);
    const location = useLocation();

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

    // Eğer rol kontrolü gerekiyorsa PermissionGuard kullan
    if (requireRoles.length > 0) {
        return (
            <PermissionGuard requireRoles={requireRoles} companyId={companyId} fallback={<Unauthorized />}>
                {children || guest}
            </PermissionGuard>
        );
    }

    return children || guest;
};

export default AuthRoute;
