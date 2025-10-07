import { createContext, useState, useContext, useEffect } from "react";

const AppBarContext = createContext(null);

export const useAppBar = () => {
    return useContext(AppBarContext);
};

export const AppBarProvider = ({ children }) => {
    // Drawer açık/kapalı durumu - localStorage'dan al
    const [drawerOpen, setDrawerOpen] = useState(() => {
        const saved = localStorage.getItem('drawerOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // AppBar açık/kapalı durumu - localStorage'dan al
    const [appBarOpen, setAppBarOpen] = useState(true);

    // Drawer durumunu localStorage'a kaydet
    useEffect(() => {
        localStorage.setItem('drawerOpen', JSON.stringify(drawerOpen));
    }, [drawerOpen]);

    // Drawer'ı aç/kapat
    const toggleDrawer = (status) => {
        if ( status !== undefined ){
            setDrawerOpen(status);
        }

        setDrawerOpen(prev => !prev);
    };

    // AppBar'ı aç/kapat
    const toggleAppBar = (status) => {
        if ( status !== undefined ){
            setAppBarOpen(status);
        }

        setAppBarOpen(prev => !prev);
    };

    const value = {
        drawerOpen,
        setDrawerOpen,
        toggleDrawer,
        appBarOpen,
        setAppBarOpen,
        toggleAppBar,
    };

    return (
        <AppBarContext.Provider value={value}>
            {children}
        </AppBarContext.Provider>
    );
};