import { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider, GlobalStyles } from '@mui/material';
import i18n from '../i18n';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
    const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
    const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('primaryColor') || '#1976d2');
    const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('fontFamily') || 'Inter');

    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    useEffect(() => {
        localStorage.setItem('language', language);
        i18n.changeLanguage(language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem('primaryColor', primaryColor);
    }, [primaryColor]);

    useEffect(() => {
        localStorage.setItem('fontFamily', fontFamily);
    }, [fontFamily]);

    const theme = useMemo(() => createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: primaryColor,
            },
            secondary: {
                main: '#dc004e',
            },
            background: {
                default: darkMode ? '#121212' : '#f4f6f8',
                paper: darkMode ? '#1e1e1e' : '#ffffff',
            },
        },
        typography: {
            fontFamily: `"${fontFamily}", "Inter", "Roboto", "Helvetica", "Arial", sans-serif`,
            h1: { fontWeight: 800 },
            h2: { fontWeight: 800 },
            h3: { fontWeight: 700 },
            h4: { fontWeight: 700 },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
            button: { fontWeight: 700 },
        },
        shape: {
            borderRadius: 16,
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        borderRadius: 12,
                        padding: '10px 24px',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    },
                },
            },
        },
    }), [darkMode, primaryColor, fontFamily]);

    return (
        <SettingsContext.Provider value={{ 
            darkMode, setDarkMode, 
            language, setLanguage, 
            primaryColor, setPrimaryColor,
            fontFamily, setFontFamily
        }}>
            <ThemeProvider theme={theme}>
                <GlobalStyles styles={{ 
                    body: { 
                        fontFamily: `"${fontFamily}", "Inter", sans-serif !important`,
                        scrollbarWidth: 'thin',
                        '&::-webkit-scrollbar': { width: '8px', height: '8px' },
                        '&::-webkit-scrollbar-track': { background: 'transparent' },
                        '&::-webkit-scrollbar-thumb': { 
                            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            borderRadius: '10px',
                            '&:hover': { backgroundColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }
                        }
                    },
                    '*': { transition: 'background-color 0.3s ease, border-color 0.3s ease' }
                }} />
                {children}
            </ThemeProvider>
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
