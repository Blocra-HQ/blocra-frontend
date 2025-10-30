import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/use-wallet";
import { useTheme } from "@/contexts/ThemeContext";
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

  const handleWalletClick = async () => {
    if (!isConnected) {
      await connectWallet('argent');
    }
  };

  return (
    <header className="glass border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => {
              const sidebar = document.querySelector('.sidebar-mobile');
              if (sidebar) {
                sidebar.classList.toggle('-translate-x-full');
              }
            }}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Network Status */}
          <RpcStatus />
          
          {/* Docs Link */}
          <Link to="/docs" className="hidden md:block">
            <Button variant="outline" size="sm">
              Docs
            </Button>
          </Link>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative hidden md:flex">
            <Bell className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-chart-error rounded-full animate-pulse" />
          </Button>

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Wallet Connection */}
          <Button 
            variant={isConnected ? "default" : "outline"}
            onClick={handleWalletClick}
            className={isConnected ? "glow-primary" : ""}
            size="sm"
          >
            <Wallet className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">
              {isConnected ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}` : "Connect"}
            </span>
          </Button>

          {/* User Menu */}
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              {profile?.fullName ? (
                <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center text-xs font-semibold text-primary-foreground">
                  {profile.fullName.charAt(0)}
                </div>
              ) : (
                <User className="w-5 h-5" />
              )}
            </Button>
          </Link>
        </div>
        </div>
      </div>
    </header>
  );
}