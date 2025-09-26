import {createContext, useState, useContext, useEffect} from "react";
import {jwtDecode} from 'jwt-decode';
import { useTranslation } from 'react-i18next';

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({children}) => {
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem(`${process.env.REACT_APP_NAME}-auth`);
        if (storedToken) {
            try {
                const {id, username} = jwtDecode(storedToken);
                setUser({
                    id,
                    username
                });
                setToken(storedToken);
            } catch (error) {
                console.error(t('auth.errors.invalidToken'), error);
                localStorage.removeItem(`${process.env.REACT_APP_NAME}-auth`);
            }
        }
    }, [t]);

    const login = ({token}) => {
        try {
            const {id, username} = jwtDecode(token);

            // Kullanıcı bilgilerini ayarla
            setUser({
                id,
                username
            });

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


    return (
        <AuthContext.Provider value={{user, token, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};