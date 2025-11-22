import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/use-wallet";
import { useTheme } from "@/contexts/ThemeContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { RpcStatus } from "@/components/ui/RpcStatus";
import {
  Bell,
  Wallet,
  User,
  Moon,
  Sun,
  Zap,
  Activity,
  Menu,
  Home
} from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, profile } = useAuth();
  const { isConnected, walletAddress, connectWallet } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useSidebar();

  const handleWalletClick = async () => {
    if (!isConnected) {
      await connectWallet('argent');
    }
  };

  return (
    <header className="glass border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 lg:px-6">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden p-1 sm:p-2"
            onClick={toggleSidebar}
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          <div>
            <h1 className="text-xs sm:text-base md:text-lg lg:text-2xl font-bold text-foreground truncate max-w-[120px] sm:max-w-none">{title}</h1>
            {subtitle && (
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground hidden sm:block truncate">{subtitle}</p>
            )}
          </div>
        </div>


        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
          {/* Network Status */}
          <RpcStatus />

          {/* Docs Link */}
          <Link to="/docs" className="hidden md:block">
            <Button variant="outline" size="sm" className="text-xs">
              Docs
            </Button>
          </Link>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative hidden md:flex">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-chart-error rounded-full animate-pulse" />
          </Button>

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="p-1 sm:p-2">
            {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </Button>

          {/* Wallet Connection */}
          <Button
            variant={isConnected ? "default" : "outline"}
            onClick={handleWalletClick}
            className={cn(
              isConnected ? "glow-primary" : "",
              "text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-auto"
            )}
          >
            <Wallet className="w-3 h-3 sm:w-4 sm:h-4 lg:mr-2" />
            <span className="hidden lg:inline text-[10px] sm:text-xs">
              {isConnected ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}` : "Connect"}
            </span>
          </Button>

          {/* User Menu */}
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="p-1 sm:p-2">
              {profile?.fullName ? (
                <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center text-xs font-semibold text-primary-foreground">
                  {profile.fullName.charAt(0)}
                </div>
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}