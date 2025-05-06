import React, { createContext, useContext, useState, useEffect } from 'react';
import LoadingScreen from '../components/common/LoadingScreen';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

  // Initialize app on first load
  useEffect(() => {
    // Apply dark mode styles immediately to body
    document.body.style.backgroundColor = '#0f172a';
    document.body.style.color = '#fff';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    // Small delay to ensure CSS is loaded
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading screen during navigation
  const showLoading = (text = 'Loading...') => {
    setLoadingText(text);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  // Toggle dark mode - for future use
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <AppContext.Provider 
      value={{ 
        isLoading, 
        showLoading, 
        hideLoading, 
        isDarkMode, 
        toggleDarkMode,
        isAppReady
      }}
    >
      {!isAppReady && <LoadingScreen text="Initializing Application..." />}
      {isLoading && <LoadingScreen text={loadingText} />}
      {children}
    </AppContext.Provider>
  );
};

export default AppContext; 