import {createContext, useState, useContext, useEffect, useRef} from "react";
import {jwtDecode} from 'jwt-decode';
import {useTranslation} from 'react-i18next';

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({children}) => {
    const {t} = useTranslation(['auth']); // ✅ namespace belirtildi
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const logoutTimerRef = useRef(null);

    const clearLogoutTimer = () => {
        if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current);
            logoutTimerRef.current = null;
        }
    };

    const logout = (gotoHomePage = true) => {
        clearLogoutTimer(); // Mevcut timeout'u temizle
        setUser(null);
        setToken(null);
        localStorage.removeItem(`${process.env.REACT_APP_NAME}-auth`);

        if ( gotoHomePage )
            window.location.href = '/';

    };

    // setTimeout 32 bitlik bir gecikme değeri aldığı için bu süreden uzun beklemeler taşar
    const MAX_TIMEOUT_DELAY = 2147483647; // ~24.8 gün

    // Token'ın geçerlilik süresi dolduğunda otomatik çıkış yapacak zamanlayıcıyı kurar
    const scheduleLogout = (expiresAt) => {
        clearLogoutTimer();

        const remainingTime = expiresAt - Date.now();

        // Uzun süreler tek seferde kurulamadığı için parçalara bölünerek zamanlanır
        if (remainingTime > MAX_TIMEOUT_DELAY) {
            logoutTimerRef.current = setTimeout(() => scheduleLogout(expiresAt), MAX_TIMEOUT_DELAY);
            return;
        }

        logoutTimerRef.current = setTimeout(logout, Math.max(remainingTime, 0));
    };

    // Token'ı decode edip süre kontrolü yapan yardımcı fonksiyon
    const validateAndDecodeToken = (tokenToValidate) => {
        try {

            const decodedToken = jwtDecode(tokenToValidate);

            // Token süresini kontrol et
            if (decodedToken.exp && decodedToken.exp * 1000 <= Date.now()) {
                console.warn(t('auth:errors.tokenExpired'));
                logout();
                return null;
            }

            clearLogoutTimer();

            // Süresi olmayan token'lar için otomatik çıkış zamanlanmaz
            if (decodedToken.exp) {
                scheduleLogout(decodedToken.exp * 1000);
            }

            return decodedToken;
        } catch (error) {
            console.error(t('auth:errors.invalidToken'), error);
            logout();
            return null;
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem(`${process.env.REACT_APP_NAME}-auth`);
        if (storedToken) {
            const decodedToken = validateAndDecodeToken(storedToken);
            if (decodedToken) {
                setUser(decodedToken);
                setToken(storedToken);
            }
        }

        // Cleanup: Component unmount olduğunda timeout'u temizle
        return () => {
            clearLogoutTimer();
        };
        // eslint-disable-next-line
    }, []);

    const login = ({token}) => {
        const decodedToken = validateAndDecodeToken(token);
        if (decodedToken) {
            // Kullanıcı bilgilerini ayarla (token içindeki tüm bilgiler)
            setUser(decodedToken);
            setToken(token);
            localStorage.setItem(`${process.env.REACT_APP_NAME}-auth`, token);
        }
    };

    const checkPermissions = (nesesarryPermissions, companyId, fullMatch = false) => {
        // Kullanıcı yoksa veya permissions yoksa
        if (!user || !user.permissions || !Array.isArray(user.permissions)) {
            return false;
        }

        // Belirtilen firmaya ait yetkileri bul
        const companyPermission = user.permissions.find(
            perm => perm.companyId === companyId
        );

        // Firma bulunamazsa yetki yok
        if (!companyPermission) {
            return false;
        }

        // Kullanıcının sahip olduğu yetkiler
        const userPermissions = companyPermission.permissions || "";

        // Admin yetkisi kontrolü (tüm yetkilere sahip)
        if (userPermissions.includes('a')) {
            return true;
        }

        // Gereken yetkileri bir diziye ayır
        const requiredPermissions = nesesarryPermissions.split("");

        if (fullMatch) {
            // Tüm yetkilerin bulunup bulunmadığını kontrol et
            return requiredPermissions.every(permission => userPermissions.includes(permission));
        } else {
            // Herhangi bir yetkinin bulunup bulunmadığını kontrol et
            return requiredPermissions.some(permission => userPermissions.includes(permission));
        }
    };


    return (
        <AuthContext.Provider value={{user, token, login, logout, checkPermissions}}>
            {children}
        </AuthContext.Provider>
    );
};
