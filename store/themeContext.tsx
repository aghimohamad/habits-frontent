import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';

type Theme = 'light' | 'dark' | null;
type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Optionally, load from storage here
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  });

  // Optionally, persist theme to storage here

  useEffect(() => {
    const listener = ({ colorScheme }:  {colorScheme: 'light' | 'dark' | null} ) => {
      setTheme(colorScheme);
    };
    Appearance.addChangeListener(listener);
    // return () => Appearance.removeChangeListener(listener);
  }, []);
  console.log(theme)
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);