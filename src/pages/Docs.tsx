import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Database,
  Activity,
  Github,
  Globe,
  FileText,
  Zap,
  Users,
  Search,
  Code,
  Book
} from "lucide-react";

export default function Docs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header title="Documentation" subtitle="Learn about BlocRA - Blockchain Research Analysis" />

      <div className="max-w-4xl mx-auto pb-12 space-y-8 p-6">

        <section id="introduction" className="space-y-4">
          <Card className="glass border-border overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Book className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">What is BlocRA?</CardTitle>
                  <CardDescription>The ultimate toolkit for Starknet analytics</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-lg leading-relaxed text-muted-foreground">
                <strong className="text-foreground">BlocRA (Blockchain Research Analysis)</strong> is a production-ready multi-chain analytics platform
                that works seamlessly across 20+ blockchains including Starknet, Ethereum, Polygon, Solana, and more.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                With <strong className="text-foreground">full mobile responsiveness</strong> and <strong className="text-foreground">instant chain switching</strong>,
                BlocRA helps you analyze blockchain data without writing code or understanding complex data structures.
              </p>
            </CardContent>
          </Card>
        </section>

        <section id="features" className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <Search className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">What BlocRA Actually Does</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Database className="w-5 h-5 mr-2 text-blue-500" />
                  Fetches Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enter any Starknet contract address and BlocRA will fetch all its events,
                  decoding them into readable formats automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="w-5 h-5 mr-2 text-green-500" />
                  Identifies Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  It looks at who is interacting with the contract and classifies them as
                  Whales, Bots, DAOs, or Regular Users.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                  Visualizes Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  See activity trends over time, user retention rates, and gas usage
                  statistics in beautiful, interactive charts.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="w-5 h-5 mr-2 text-orange-500" />
                  Generates Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create professional PDF intelligence reports with AI-powered insights
                  and strategic recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Globe className="w-5 h-5 mr-2 text-cyan-500" />
                  Multi-Chain Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Switch between 20+ blockchains (Ethereum, BSC, Polygon, Solana, etc.) instantly
                  without page reloads. Chain-aware address validation adapts automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Activity className="w-5 h-5 mr-2 text-pink-500" />
                  Mobile Optimized
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Fully responsive design with touch-optimized controls, hamburger menu navigation,
                  and adaptive text sizing for perfect mobile experience.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="how-to-use" className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">How to Use BlocRA (Step by Step)</h2>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-xl bg-card border border-border">
              <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Select Your Blockchain</h3>
                <p className="text-muted-foreground">
                  Choose from 20+ supported chains using the chain selector in the sidebar.
                  The interface automatically adapts to your selected blockchain.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-card border border-border">
              <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Enter Contract Address</h3>
                <p className="text-muted-foreground">
                  Paste your contract address - BlocRA validates it based on the selected chain.
                  Add a custom name and click "Fetch Events" to start the analysis.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-card border border-border">
              <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Generate Report</h3>
                <p className="text-muted-foreground">
                  Click "Generate Report" to get a comprehensive PDF analysis. This includes
                  AI-driven insights about the contract's performance and risks.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="technical" className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <Code className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">How BlocRA Works Technically</h2>
          </div>

          <Card className="glass border-border">
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Frontend</h3>
                  <p className="text-sm text-muted-foreground">
                    Built with React, TypeScript, and Tailwind CSS for a fast, responsive experience.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Multi-Chain RPC</h3>
                  <p className="text-sm text-muted-foreground">
                      Connects to 20+ blockchains with automatic failover and instant chain switching (&lt;500ms).
                    </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Mobile-First</h3>
                  <p className="text-sm text-muted-foreground">
                    Responsive design with touch controls, optimized text sizing, and seamless navigation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="cta" className="pt-8">
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-8 text-center border border-primary/20">
            <CardTitle className="text-3xl mb-4">Ready to Try BlocRA?</CardTitle>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start analyzing Starknet contracts today and get deep insights into your dApp's usage and performance.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="glow-primary" onClick={() => window.location.href = '/'}>
                Go to Dashboard
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" onClick={() => window.open('https://github.com/Ndifreke000/BlocRA', '_blank')}>
                <Github className="w-5 h-5 mr-2" />
                View on GitHub
              </Button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}