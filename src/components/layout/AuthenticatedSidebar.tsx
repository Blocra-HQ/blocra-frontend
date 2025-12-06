import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { ChainSelector } from "@/components/ChainSelector";
import {
  Database,
  Layout,
  Trophy,
  Settings,
  Search,
  Home,
  Plus,
  LogOut,
  Activity,
  Book,
  X
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Query Editor", href: "/query", icon: Database },
  { name: "Dashboard Builder", href: "/builder", icon: Layout },
  { name: "Library", href: "/library", icon: Book },
  { name: "Contract Analysis", href: "/contract-events-eda", icon: Activity },
  { name: "Bounties", href: "/bounties", icon: Trophy },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface AuthenticatedSidebarProps {
  className?: string;
}

export function AuthenticatedSidebar({ className }: AuthenticatedSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isOpen, closeSidebar } = useSidebar();

  const handleProfileClick = () => {
    navigate('/profile');
    closeSidebar(); // Close sidebar on mobile after navigation
  };

  const handleLinkClick = () => {
    closeSidebar(); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-screen bg-card border-r border-border text-card-foreground w-64 transition-transform duration-300 ease-in-out z-40",
          "lg:translate-x-0", // Always visible on desktop
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0", // Toggle on mobile
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between gap-3 px-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border border-border">
                <img
                  src="/blocra-logo.png"
                  alt="BlocRA Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-base sm:text-lg font-bold text-foreground whitespace-nowrap">
                BlocRA
              </span>
            </div>
            {/* Close button - visible only on mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={closeSidebar}
              className="lg:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Chain Selector */}
          <div className="p-4 border-b border-border">
            <ChainSelector />
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Quick Actions */}
            <div className="pt-4">
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Actions
                </p>
              </div>
              <Link
                to="/create-bounty"
                onClick={handleLinkClick}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 group text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Plus className="w-5 h-5 transition-colors text-muted-foreground group-hover:text-foreground" />
                <span>Create Bounty</span>
              </Link>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="space-y-3">
              {profile && (
                <div className="flex items-center space-x-3 px-3 py-3 cursor-pointer hover:bg-muted rounded-xl transition-all duration-200" onClick={handleProfileClick}>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center ring-1 ring-border">
                    <span className="text-sm font-semibold text-primary">
                      {profile.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                      {profile.firstName || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="w-full justify-center border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}