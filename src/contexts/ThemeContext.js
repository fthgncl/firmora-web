import {ThemeProvider, createTheme} from "@mui/material/styles";
import {useState, createContext, useEffect, useMemo} from "react";
import {themes} from "../config/themes";

const ThemeContext = createContext(undefined);

const defaultThemeName = process.env.REACT_APP_DEFAULT_THEME;

const saveTheme = (themeName) => {
    const foundTheme = themes.find(theme => theme.name === themeName);
    if (!foundTheme)
        return false;

    localStorage.setItem(process.env.REACT_APP_THEME_STORAGE_KEY, themeName);
    return true;
}

const getThemeProps = (themeName) => {
    const foundTheme = themes.find(theme => theme.name === themeName);
    if (foundTheme) {
        return foundTheme;
    }

    // Environment değişkeni henüz yüklenmemişse veya bulunamıyorsa
    const defaultTheme = defaultThemeName ? 
        themes.find(theme => theme.name === defaultThemeName) : 
        themes[0]; // İlk temayı fallback olarak kullan

    return defaultTheme || themes[0]; // Son çare olarak ilk temayı döndür
};

export const AppThemeProvider = ({children}) => {
    const [themeName, changeTheme] = useState(localStorage.getItem(process.env.REACT_APP_THEME_STORAGE_KEY) || defaultThemeName);

    // Tema değiştiğinde yeniden hesapla
    const theme = useMemo(() => {
        const themePalette = getThemeProps(themeName).vars;
        return createTheme(themePalette);
    }, [themeName]);

    useEffect(() => {
        saveTheme(themeName);
    }, [themeName]);

    return (
        <ThemeProvider theme={theme}>
            <ThemeContext.Provider value={{changeTheme, themeName}}>
                {children}
            </ThemeContext.Provider>
        </ThemeProvider>
    );
};


export default ThemeContext;