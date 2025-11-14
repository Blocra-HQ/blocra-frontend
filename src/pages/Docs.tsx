import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthenticatedSidebar } from "@/components/layout/AuthenticatedSidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  Database, 
  Activity,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Github,
  Globe,
  FileText,
  Zap,
  Users,
  Target,
  TrendingUp,
  PieChart,
  Download,
  Bot,
  Network,
  Bell,
  Camera
} from "lucide-react";

export default function Docs() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header title="Documentation" subtitle="Learn about BloDI - Blockchain Data Intelligence for Starknet" />
      <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* What is BloDI */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">What is BloDI?</CardTitle>
                    <CardDescription>Blockchain Data Intelligence for Starknet</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200">Live Demo</Badge>
                  <Badge variant="outline">Open Source</Badge>
                  <Badge variant="outline">React + TypeScript</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  BloDI (Blockchain Data Intelligence) is a web application that helps you analyze Starknet smart contracts 
                  and their activity. Think of it as a specialized tool for understanding what's happening on the Starknet blockchain.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Instead of manually checking transactions and events, BloDI fetches real-time data from Starknet, 
                  analyzes it, and presents it in easy-to-understand charts and reports. It's particularly useful for 
                  developers, researchers, and anyone curious about how Starknet contracts are performing.
                </p>
              </CardContent>
            </Card>

            {/* What BloDI Actually Does */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span>What BloDI Actually Does</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Contract Event Analysis</h3>
                        <p className="text-sm text-muted-foreground">
                          Enter any Starknet contract address and BloDI will fetch all its events, 
                          decode them, and show you what's been happening.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-1">
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">User Classification</h3>
                        <p className="text-sm text-muted-foreground">
                          Automatically categorizes users as Whales (big holders), Bots (automated), 
                          DAOs (organizations), or Regular Users based on their activity patterns.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mt-1">
                        <PieChart className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Multi-Contract Analytics</h3>
                        <p className="text-sm text-muted-foreground">
                          Analyze multiple contracts simultaneously with dependency graphs, 
                          cross-contract interactions, and comprehensive dashboards.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mt-1">
                        <FileText className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Blocra Intelligence Engine</h3>
                        <p className="text-sm text-muted-foreground">
                          Advanced AI analysis with anomaly detection, predictive analytics, 
                          and professional PDF reports with 12 comprehensive sections.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How to Use BloDI */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <span>How to Use BloDI (Step by Step)</span>
                </CardTitle>
                <CardDescription>
                  It's actually quite simple - here's how it works:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">Find a Starknet Contract</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get the contract address from Starkscan, Voyager, or any Starknet explorer. 
                        It looks like: <code className="bg-muted px-1 rounded">0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7</code>
                      </p>
                      <Button size="sm" variant="outline" onClick={() => window.open('https://starkscan.co', '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Starkscan
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">Analyze the Contract</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Go to "Contract Analysis" in BloDI, paste the address, give it a name, and click "Fetch Events". 
                        BloDI will pull all the contract's activity and start analyzing it.
                      </p>
                      <Button size="sm" variant="outline" onClick={() => navigate('/contract-events-eda')}>
                        <Activity className="w-4 h-4 mr-2" />
                        Try Contract Analysis
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">Explore the Results</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        You'll see charts showing user activity, transaction patterns, gas usage, and more. 
                        Each chart tells you something different about how the contract is being used.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">Generate Reports (Optional)</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Click "Generate PDF Report" to get a professional analysis document with business insights, 
                        risk assessment, and recommendations. Great for sharing with teams or stakeholders.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real Examples */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Real Examples of What You'll Discover</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold mb-1">DeFi Protocol Health</h3>
                    <p className="text-sm text-muted-foreground">
                      See if a DEX is growing or shrinking, identify the biggest traders, 
                      and spot unusual activity patterns that might indicate problems or opportunities.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold mb-1">NFT Collection Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      Track minting activity, identify whale collectors, analyze trading patterns, 
                      and understand which features drive the most engagement.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold mb-1">Gaming Contract Usage</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor player activity, identify power users vs casual players, 
                      track in-game economy health, and spot potential bot activity.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-semibold mb-1">Token Distribution Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Understand how tokens are distributed, identify concentration risks, 
                      track holder behavior, and analyze transfer patterns.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-primary" />
                  <span>How BloDI Works Technically</span>
                </CardTitle>
                <CardDescription>
                  For the curious minds who want to know what's happening under the hood
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="font-semibold">Data Collection</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Connects to Starknet RPC endpoints</li>
                        <li>• Fetches contract events in real-time</li>
                        <li>• Decodes event data automatically</li>
                        <li>• Handles multiple RPC providers for reliability</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold">Analysis Engine</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Classifies users based on transaction patterns</li>
                        <li>• Calculates performance metrics</li>
                        <li>• Generates statistical insights</li>
                        <li>• Creates time-series data for charts</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Built With</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">React</Badge>
                      <Badge variant="outline">TypeScript</Badge>
                      <Badge variant="outline">Vite</Badge>
                      <Badge variant="outline">Tailwind CSS</Badge>
                      <Badge variant="outline">Recharts</Badge>
                      <Badge variant="outline">starknet.js</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Get Started */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle>Ready to Try BloDI?</CardTitle>
                <CardDescription>
                  Start analyzing Starknet contracts in under 2 minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-auto p-4 flex flex-col items-center space-y-2" onClick={() => navigate('/contract-events-eda')}>
                    <Activity className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-semibold">Analyze a Contract</div>
                      <div className="text-xs opacity-75">Start with contract analysis</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" onClick={() => window.open('https://github.com/Ndifreke000/BloDI', '_blank')}>
                    <Github className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-semibold">View Source Code</div>
                      <div className="text-xs opacity-75">Check out the code</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" onClick={() => window.open('https://blodi-suite.vercel.app/', '_blank')}>
                    <Globe className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-semibold">Live Demo</div>
                      <div className="text-xs opacity-75">Try it online</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </main>
    </div>
  );
}