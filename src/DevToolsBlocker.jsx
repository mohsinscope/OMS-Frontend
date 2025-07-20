// src/components/DevToolsBlocker.jsx
import { useEffect } from 'react';

const DevToolsBlocker = () => {
  useEffect(() => {
    // Disable right-click
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Disable keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
      }
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
      }
    });

    const intervalId = setInterval(() => {
      console.clear();

    }, 50);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
      document.removeEventListener('keydown', (e) => e.preventDefault());
    };
  }, []);

  return null;
};

export default DevToolsBlocker;