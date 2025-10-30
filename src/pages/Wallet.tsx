import { useState, useEffect } from "react";
import { AuthenticatedSidebar } from "@/components/layout/AuthenticatedSidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SocialLoginDialog } from "@/components/auth/SocialLoginDialog";
import { 
  Wallet as WalletIcon, 
  ExternalLink, 
  Copy, 
  Send, 
  ArrowDown, 
  History, 
  Shield,
  Zap,
  AlertCircle,
  Check,
  TrendingUp,
  TrendingDown
} from "lucide-react";



export default function Wallet() {
  interface Transaction {
    hash: string;
    type: "sent" | "received";
    amount: string;
    token: string;
    timestamp: string;
    status: "confirmed" | "pending" | "failed";
  }
  interface TokenBalance {
    symbol: string;
    balance: string;
    usdValue: string;
    change24h: number;
  }

  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<"argent" | "ready" | null>(null);
  const [detectedWallets, setDetectedWallets] = useState<{ argent: boolean; ready: boolean }>({ argent: false, ready: false });
  const [showSocialLogin, setShowSocialLogin] = useState(false);

  useEffect(() => {
    const checkWallets = () => {
      const argentDetected = typeof window !== 'undefined' && !!(window as any).starknet_argentX;
      const readyDetected = typeof window !== 'undefined' && !!(window as any).starknet_ready;
      setDetectedWallets({ argent: argentDetected, ready: readyDetected });
    };
    
    checkWallets();
    // Check again after a delay for wallet extensions that load slowly
    setTimeout(checkWallets, 1000);
  }, []);

  const [tokenBalances] = useState<TokenBalance[]>([
    { symbol: "ETH", balance: "2.45", usdValue: "4,890.50", change24h: 2.34 },
    { symbol: "STRK", balance: "1,250.00", usdValue: "2,500.00", change24h: -1.23 },
    { symbol: "USDC", balance: "500.00", usdValue: "500.00", change24h: 0.01 },
  ]);

  const [recentTransactions] = useState<Transaction[]>([
    {
      hash: "0x1234...5678",
      type: "received",
      amount: "0.5 ETH",
      token: "ETH",
      timestamp: "2 hours ago",
      status: "confirmed"
    },
    {
      hash: "0x9876...5432",
      type: "sent",
      amount: "100 STRK",
      token: "STRK",
      timestamp: "1 day ago",
      status: "confirmed"
    },
    {
      hash: "0x5555...1111",
      type: "sent",
      amount: "50 USDC",
      token: "USDC",
      timestamp: "3 days ago",
      status: "pending"
    },
  ]);

  const connectWallet = async (walletType: "argent" | "ready") => {
    setSelectedWallet(walletType);
    try {
      let wallet;
      if (walletType === 'argent' && (window as any).starknet_argentX) {
        wallet = (window as any).starknet_argentX;
      } else if (walletType === 'ready' && (window as any).starknet_ready) {
        wallet = (window as any).starknet_ready;
      }
      
      if (wallet) {
        await wallet.enable();
        const accounts = await wallet.request({ type: 'wallet_requestAccounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          setWalletAddress(accounts[0]);
          console.log(`Connected to ${walletType} wallet:`, accounts[0]);
        }
      } else {
        // Fallback simulation
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsConnected(true);
        setWalletAddress("0x1234567890abcdef1234567890abcdef12345678");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setSelectedWallet(null);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress("");
    setSelectedWallet(null);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
  };

  const getTotalBalance = () => {
    return tokenBalances.reduce((sum, token) => sum + parseFloat(token.usdValue.replace(",", "")), 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedSidebar />
      
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header 
          title="Wallet" 
          subtitle="Manage your Starknet wallet and view portfolio"
        />
        
        <main className="flex-1 p-6 space-y-6">
          {!isConnected ? (
            /* Wallet Connection */
            <Card className="glass border-border max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2">
                  <WalletIcon className="w-6 h-6" />
                  <span>Connect Wallet</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {detectedWallets.argent && (
                  <Button
                    onClick={() => connectWallet("argent")}
                    variant="outline"
                    className="w-full h-16 flex items-center justify-between p-4 hover:bg-primary/10 hover:border-primary"
                    disabled={selectedWallet === "argent"}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">A</span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Argent X</p>
                        <p className="text-xs text-muted-foreground">Most popular Starknet wallet</p>
                      </div>
                    </div>
                    {selectedWallet === "argent" && (
                      <div className="animate-spin">
                        <Zap className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                )}
                {detectedWallets.ready && (
                  <Button
                    onClick={() => connectWallet("ready")}
                    variant="outline"
                    className="w-full h-16 flex items-center justify-between p-4 hover:bg-primary/10 hover:border-primary"
                    disabled={selectedWallet === "ready"}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">R</span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Ready</p>
                        <p className="text-xs text-muted-foreground">Connect to Ready wallet</p>
                      </div>
                    </div>
                    {selectedWallet === "ready" && (
                      <div className="animate-spin">
                        <Zap className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => setShowSocialLogin(true)}
                  variant="outline"
                  className="w-full h-16 flex items-center justify-between p-4 hover:bg-primary/10 hover:border-primary"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">C</span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Social Login</p>
                      <p className="text-xs text-muted-foreground">Login with Google, Twitter, or Email</p>
                    </div>
                  </div>
                </Button>
                
                <SocialLoginDialog
                  open={showSocialLogin}
                  onClose={() => setShowSocialLogin(false)}
                />
                
                {!detectedWallets.argent && !detectedWallets.ready && (
                  <div className="text-center text-muted-foreground py-4">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    <p>No supported Starknet wallets detected in your browser.<br/>Please install <a href="https://www.argent.xyz/argent-x/" target="_blank" rel="noopener noreferrer" className="underline">Argent X</a> or <a href="https://ready.gg/" target="_blank" rel="noopener noreferrer" className="underline">Ready</a>.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Connected Wallet View */
            <div className="space-y-6">
              {/* Wallet Info */}
              <Card className="glass border-border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <WalletIcon className="w-5 h-5" />
                      <span>Wallet Overview</span>
                    </div>
                    <Badge variant="secondary" className="glow-primary">
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Wallet Address</p>
                      <p className="font-mono text-sm">{walletAddress}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={copyAddress}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                    <p className="text-4xl font-bold text-primary">
                      ${getTotalBalance().toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button className="flex-1 glow-primary">
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Receive
                    </Button>
                    <Button variant="outline" onClick={disconnectWallet}>
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Token Balances */}
              <Card className="glass border-border">
                <CardHeader>
                  <CardTitle>Token Balances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tokenBalances.map((token) => (
                      <div key={token.symbol} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground font-semibold text-sm">
                              {token.symbol.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{token.symbol}</p>
                            <p className="text-sm text-muted-foreground">{token.balance}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${token.usdValue}</p>
                          <div className="flex items-center space-x-1">
                            {token.change24h > 0 ? (
                              <TrendingUp className="w-3 h-3 text-green-400" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-400" />
                            )}
                            <span className={`text-xs ${token.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="glass border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="w-5 h-5" />
                    <span>Recent Transactions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTransactions.map((tx) => (
                      <div key={tx.hash} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === "sent" ? "bg-red-500/20" : "bg-green-500/20"
                    }`}>
                      {tx.type === "sent" ? (
                        <Send className="w-4 h-4 text-red-400" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-green-400" />
                      )}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{tx.type} {tx.amount}</p>
                            <p className="text-sm text-muted-foreground">{tx.hash}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={tx.status === "confirmed" ? "secondary" : tx.status === "pending" ? "outline" : "destructive"}
                            className="mb-1"
                          >
                            {tx.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{tx.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}