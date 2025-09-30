import {createContext, useState, useContext, useEffect} from "react";
import {jwtDecode} from 'jwt-decode';
import {useTranslation} from 'react-i18next';

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({children}) => {
    const {t} = useTranslation();
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem(`${process.env.REACT_APP_NAME}-auth`);
        if (storedToken) {
            try {
                const decodedToken = jwtDecode(storedToken);
                setUser(decodedToken);
                setToken(storedToken);
            } catch (error) {
                console.error(t('auth.errors.invalidToken'), error);
                localStorage.removeItem(`${process.env.REACT_APP_NAME}-auth`);
            }
        }
        // eslint-disable-next-line
    }, []);

    const login = ({token}) => {
        try {
            const decodedToken = jwtDecode(token);

            // Kullanıcı bilgilerini ayarla (token içindeki tüm bilgiler)
            setUser(decodedToken);

            setToken(token);
            localStorage.setItem(`${process.env.REACT_APP_NAME}-auth`, token);
        } catch (error) {
            console.error(t('auth.errors.tokenDecodeError'), error);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem(`${process.env.REACT_APP_NAME}-auth`);
    };

    const checkPermissions = (nesesarryPermissions, fullMatch = false) => {
        // Kullanıcının sahip olduğu yetkiler
        const userPermissions = user.permissions || "";

        if (userPermissions.includes('a'))
            return true;

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