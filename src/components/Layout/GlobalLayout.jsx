import React from 'react';
import ThemeToggle from '../ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

// This is a layout component that will wrap around all pages
// It provides a consistent layout with the theme toggle in a fixed position
const GlobalLayout = ({ children }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="relative min-h-screen">
      {/* Global Theme Toggle (fixed position) */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle 
          className={`shadow-lg ${isDark ? 'hover:scale-110' : 'hover:scale-110'}`} 
        />
      </div>
      
      {/* Content */}
      {children}
    </div>
  );
};

export default GlobalLayout;