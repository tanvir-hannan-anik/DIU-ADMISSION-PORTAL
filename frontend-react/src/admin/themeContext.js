import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext({ mode: 'dark', toggle: () => {} });
const KEY = 'adminTheme';

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem(KEY) || 'dark');

  useEffect(() => { localStorage.setItem(KEY, mode); }, [mode]);

  const toggle = useCallback(() => setMode((m) => (m === 'dark' ? 'light' : 'dark')), []);

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <div className="admin-scope" data-theme={mode} style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
