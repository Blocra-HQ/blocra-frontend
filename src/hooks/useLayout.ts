import { useState, useEffect } from 'react';

export const useLayout = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      const sidebar = document.querySelector('.sidebar-mobile');
      if (sidebar) {
        sidebar.classList.toggle('-translate-x-full');
      }
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const getMainContentClass = () => {
    return isMobile ? 'w-full' : 'lg:ml-64';
  };

  return {
    isMobile,
    sidebarCollapsed,
    toggleSidebar,
    getMainContentClass,
  };
};