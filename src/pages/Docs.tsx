import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthenticatedSidebar } from "@/components/layout/AuthenticatedSidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Code, 
  Database, 
  Zap, 
  Shield, 
  BarChart3, 
  Trophy,
  Rocket,
  Users,
  Globe,
  ExternalLink,
  Github,
  Star,
  Download,
  Copy,
  Terminal,
  Play,
  CheckCircle,
  ArrowRight,
  Wallet,
  Search,
  Layout,
  Activity
} from "lucide-react";

export default function Docs() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedSidebar />
      <div className="lg:ml-64">
        <Header title="Documentation" subtitle="Complete guide to get started with Starklytics Suite" />
        <main className="p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Welcome Section */}
            <Card className="glass-card border-border/30">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Welcome to Starklytics Suite
                    </CardTitle>
                    <CardDescription className="text-lg">
                      Your complete guide to Starknet analytics and bounty management
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Production Ready
                  </Badge>
                  <Badge variant="outline">
                    MIT License
                  </Badge>
                  <Badge variant="outline">
                    TypeScript
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* New Features Section */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <span>Latest Features</span>
                </CardTitle>
                <CardDescription>
                  Discover the newest capabilities in Starklytics Suite
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Real-Time Statistics
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Live WebSocket updates for bounty metrics and participant activity
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      Enhanced Bounty System
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Improved bounty creation, participation tracking, and completion verification
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Security Features
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Rate limiting, input validation, and secure file upload handling
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Database className="w-4 h-4 text-primary" />
                      Data Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Monthly statistics, CSV exports, and comprehensive data exploration tools
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Start Guide */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Rocket className="w-5 h-5 text-primary" />
                  <span>Quick Start - Get Up and Running in 5 Minutes</span>
                </CardTitle>
                <CardDescription>
                  Follow these steps to start analyzing Starknet data and managing bounties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <h3 className="font-semibold">Choose Your Role</h3>
                    <p className="text-sm text-muted-foreground">Select Analyst, Creator, or Admin based on your goals</p>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => navigate('/profile')}>
                      <Users className="w-4 h-4 mr-2" />
                      Set Role
                    </Button>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <h3 className="font-semibold">Connect Wallet</h3>
                    <p className="text-sm text-muted-foreground">Link your Argent X or Braavos wallet for DeFi features</p>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => navigate('/wallet')}>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <h3 className="font-semibold">Start Exploring</h3>
                    <p className="text-sm text-muted-foreground">Browse analytics, create queries, or join bounties</p>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => navigate('/analytics')}>
                      <Play className="w-4 h-4 mr-2" />
                      Explore
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <span>What is Starklytics Suite?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Starklytics Suite is a <strong>production-ready, enterprise-grade platform</strong> that revolutionizes how developers and analysts interact with the Starknet ecosystem.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Real-time Starknet analytics</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Automated bounty management</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">AI-powered data insights</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Enterprise-grade security</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <span>Why Choose Starklytics?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                        <Zap className="w-3 h-3 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Lightning Fast</h4>
                        <p className="text-sm text-muted-foreground">Optimized performance with modern tech stack</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                        <Shield className="w-3 h-3 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Secure by Design</h4>
                        <p className="text-sm text-muted-foreground">Production-grade security and validation</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                        <Users className="w-3 h-3 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Community Driven</h4>
                        <p className="text-sm text-muted-foreground">Built for and by the Starknet community</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Core Features */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-primary" />
                  <span>Core Platform Features</span>
                </CardTitle>
                <CardDescription>
                  Everything you need to analyze Starknet data and manage bounties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold">Real-Time Analytics</h3>
                    <p className="text-sm text-muted-foreground">Live Starknet data with interactive visualizations</p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold">Query Editor</h3>
                    <p className="text-sm text-muted-foreground">SQL-like interface for custom data analysis</p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold">Bounty System</h3>
                    <p className="text-sm text-muted-foreground">Smart contract-based reward management</p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto">
                      <Layout className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold">Dashboard Builder</h3>
                    <p className="text-sm text-muted-foreground">Create custom analytics dashboards</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Getting Started Tutorials */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span>Step-by-Step Tutorials</span>
                </CardTitle>
                <CardDescription>
                  Learn how to use each feature with hands-on tutorials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <span>Analytics Tutorials</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/query')}>
                        <div>
                          <h4 className="font-medium text-sm">Your First Query</h4>
                          <p className="text-xs text-muted-foreground">Learn to query Starknet data</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/builder')}>
                        <div>
                          <h4 className="font-medium text-sm">Building Dashboards</h4>
                          <p className="text-xs text-muted-foreground">Create custom visualizations</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/contract-events-eda')}>
                        <div>
                          <h4 className="font-medium text-sm">Contract Analysis</h4>
                          <p className="text-xs text-muted-foreground">Analyze smart contract events</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span>Bounty Tutorials</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/create-bounty')}>
                        <div>
                          <h4 className="font-medium text-sm">Creating Your First Bounty</h4>
                          <p className="text-xs text-muted-foreground">Set up and fund a bounty</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/bounties')}>
                        <div>
                          <h4 className="font-medium text-sm">Joining Bounties</h4>
                          <p className="text-xs text-muted-foreground">Submit solutions and earn rewards</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/bounties')}>
                        <div>
                          <h4 className="font-medium text-sm">Managing Submissions</h4>
                          <p className="text-xs text-muted-foreground">Review and select winners</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Roles & Permissions */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>User Roles & What You Can Do</span>
                </CardTitle>
                <CardDescription>
                  Choose the role that matches your goals and unlock specific features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Search className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold">Analyst</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Perfect for data analysts and researchers</p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">Browse and join bounties</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">Access all analytics tools</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">Submit solutions</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">Earn rewards</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold">Creator</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Ideal for project managers and researchers</p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">Create and fund bounties</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">Manage submissions</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">Select winners</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">All analyst features</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold">Admin</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Full platform access and management</p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">Platform management</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">User management</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">System monitoring</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">All features</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Common Use Cases */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <span>Common Use Cases & Examples</span>
                </CardTitle>
                <CardDescription>
                  Real-world scenarios where Starklytics Suite adds value
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">DeFi Protocol Analysis</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Track TVL changes, analyze user behavior, and monitor protocol health across Starknet DeFi protocols.
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">Analytics</Badge>
                      <Badge variant="outline" className="text-xs">Query Editor</Badge>
                      <Badge variant="outline" className="text-xs">Dashboards</Badge>
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold mb-2">Security Research Bounties</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Create bounties for security audits, vulnerability research, and protocol analysis with automated rewards.
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">Bounties</Badge>
                      <Badge variant="outline" className="text-xs">Smart Contracts</Badge>
                      <Badge variant="outline" className="text-xs">Rewards</Badge>
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold mb-2">Network Growth Tracking</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Monitor transaction volumes, new user adoption, and ecosystem growth with real-time dashboards.
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">Real-time Data</Badge>
                      <Badge variant="outline" className="text-xs">Visualizations</Badge>
                      <Badge variant="outline" className="text-xs">AI Insights</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span>Frequently Asked Questions</span>
                </CardTitle>
                <CardDescription>
                  Quick answers to common questions about the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">How do I get started with analytics?</h3>
                    <p className="text-sm text-muted-foreground">
                      Simply navigate to the Analytics page, choose a pre-built query, or create your own using our SQL-like interface. All Starknet data is available in real-time.
                    </p>
                  </div>
                  
                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">What wallets are supported?</h3>
                    <p className="text-sm text-muted-foreground">
                      We support Argent X and Braavos wallets. Simply install the browser extension and connect through our wallet integration.
                    </p>
                  </div>
                  
                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">How do bounty rewards work?</h3>
                    <p className="text-sm text-muted-foreground">
                      Bounty creators fund rewards through smart contracts. When a winner is selected, payments are automatically distributed via AutoSwappr integration.
                    </p>
                  </div>
                  
                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Is my data secure?</h3>
                    <p className="text-sm text-muted-foreground">
                      Yes! We use enterprise-grade security with input validation, rate limiting, and comprehensive error handling. All wallet interactions are non-custodial.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Rocket className="w-5 h-5 text-primary" />
                  <span>Ready to Get Started?</span>
                </CardTitle>
                <CardDescription>
                  Choose your path and start exploring Starknet data today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">For New Users</h3>
                    <div className="space-y-3">
                      <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/analytics')}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Explore Analytics Dashboard
                      </Button>
                      <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/query')}>
                        <Database className="w-4 h-4 mr-2" />
                        Try Query Editor
                      </Button>
                      <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/bounties')}>
                        <Trophy className="w-4 h-4 mr-2" />
                        Browse Active Bounties
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">For Developers</h3>
                    <div className="space-y-3">
                      <Button className="w-full justify-start" variant="outline" onClick={() => window.open('https://github.com/starklytics/suite', '_blank')}>
                        <Github className="w-4 h-4 mr-2" />
                        View Source Code
                      </Button>
                      <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/docs')}>
                        <Code className="w-4 h-4 mr-2" />
                        API Documentation
                      </Button>
                      <Button className="w-full justify-start" variant="outline" onClick={() => window.open('https://vercel.com/new/clone?repository-url=https://github.com/starklytics/suite', '_blank')}>
                        <Download className="w-4 h-4 mr-2" />
                        Deploy Your Own
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
}