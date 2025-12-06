import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthenticatedSidebar } from './AuthenticatedSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  // Pages that don't need sidebar
  const noSidebarPages = ['/auth', '/docs', '/admin', '/admin/dashboard'];
  const shouldShowSidebar = !noSidebarPages.some(page => location.pathname.startsWith(page));

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AuthenticatedSidebar />
      <main className="ml-0 lg:ml-64 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}