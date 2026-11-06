import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/use-wallet";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { useRpcEndpoint } from "@/hooks/useRpcEndpoint";

import {
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
  const { isConnected, isAuthenticated, walletAddress, signIn } = useWallet();
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar();
  const { status: rpcStatus, activeEndpoint } = useRpcEndpoint();

  // One click: connect Freighter (if needed) and sign in with it.
  const handleWalletClick = async () => {
    if (isAuthenticated) return;
    try {
      await signIn();
      toast.success("Signed in with your Stellar wallet");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wallet sign-in failed");
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-3 sm:px-4 lg:px-6">
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


          {/* Docs Link */}
          <Link to="/docs" className="hidden md:block">
            <Button variant="outline" size="sm" className="text-xs">
              Docs
            </Button>
          </Link>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1 sm:p-2"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </Button>

          {/* Wallet Connection */}
          {/* RPC Status Indicator (Circle) */}
          <div className="flex items-center">
            <div
              className="relative p-2"
              title={
                rpcStatus === 'connected' ? `RPC Connected: ${activeEndpoint}` :
                  rpcStatus === 'connecting' ? "RPC Connecting..." :
                    "RPC Connection Failed"
              }
            >
              <div className={cn(
                "w-3 h-3 rounded-full shadow-sm transition-all duration-300",
                rpcStatus === 'connected' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" :
                  rpcStatus === 'connecting' ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" :
                    "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              )} />
            </div>
          </div>

          {/* Wallet Connection Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleWalletClick}
            className={cn(
              "flex items-center gap-2",
              !isConnected && "text-muted-foreground hover:text-foreground"
            )}
            title={isAuthenticated ? "Signed in with Stellar wallet" : isConnected ? "Sign in with Freighter" : "Connect Freighter wallet"}
          >
            <Wallet className={cn("w-4 h-4 sm:w-5 sm:h-5", isConnected && "text-primary")} />
            {isConnected && (
              <span className="hidden lg:inline-block text-xs font-medium">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </span>
            )}
          </Button>

          {/* Account: profile when signed in (email or wallet), otherwise sign in */}
          {!user && !isAuthenticated ? (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="text-xs">Sign in</Button>
            </Link>
          ) : (
          <Link to="/profile" title={user?.email || "Profile"}>
            <Button variant="ghost" size="icon" className="p-1 sm:p-2">
              {profile?.fullName ? (
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-semibold text-primary-foreground">
                  {profile.fullName.charAt(0)}
                </div>
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </Button>
          </Link>
          )}
        </div>
      </div>
    </header>
  );
}