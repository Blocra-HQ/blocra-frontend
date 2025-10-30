import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/use-wallet";
import { 
  BarChart3, 
  Database, 
  Layout, 
  Trophy, 
  Wallet, 
  Settings, 
  ChevronLeft,
  Search,
  Home,
  User,
  Plus,
  LogOut,
  FileBarChart,
  Activity,
  Book
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Query Editor", href: "/query", icon: Database },
  { name: "Dashboard Builder", href: "/builder", icon: Layout },
  { name: "Library", href: "/library", icon: Book },
  { name: "Contract Analysis", href: "/contract-events-eda", icon: Activity },
  { name: "Bounties", href: "/bounties", icon: Trophy },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface AuthenticatedSidebarProps {
  className?: string;
}

export function AuthenticatedSidebar({ className }: AuthenticatedSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { connectWallet, isConnected, walletAddress, detectWallets } = useWallet();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleWalletClick = async () => {
    if (isConnected) {
      navigate('/wallet');
      return;
    }

    try {
      const detectedWallets = detectWallets();
      if (detectedWallets.argent) {
        await connectWallet('argent');
      } else if (detectedWallets.ready) {
        await connectWallet('ready');
      } else {
        // If no wallet is detected, still navigate to wallet page where they can see installation options
        navigate('/wallet');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      navigate('/wallet');
    }
  };

  return (
    <div
      className={cn(
        "sidebar-mobile fixed left-0 top-0 h-screen glass-card border-r border-border/30 text-card-foreground transition-all duration-300 z-40 shadow-2xl",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-accent/5">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Starklytics
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-accent/10"
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-foreground hover:shadow-md"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* Quick Actions */}
          {!collapsed && (
            <div className="pt-4">
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Actions
                </p>
              </div>
              <Link
                to="/create-bounty"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group text-muted-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-foreground hover:shadow-md"
              >
                <Plus className="w-5 h-5 transition-colors text-muted-foreground group-hover:text-primary" />
                <span>Create Bounty</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 bg-gradient-to-r from-primary/5 to-accent/5 space-y-3">
          {!collapsed && (
            <div className="space-y-2">
              {profile && (
                <div className="flex items-center space-x-3 px-3 py-2.5 cursor-pointer hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 rounded-xl transition-all duration-200 hover:shadow-md" onClick={handleProfileClick}>
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg ring-2 ring-primary/20">
                    <span className="text-xs font-semibold text-primary-foreground">
                      {profile.full_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {profile.full_name || profile.username || 'Analytics User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWalletClick}
                  className="flex-1 justify-start hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-200"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {isConnected ? 'Wallet' : 'Connect'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="flex-1 justify-start border-border/50 hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/5 hover:border-destructive/30 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}