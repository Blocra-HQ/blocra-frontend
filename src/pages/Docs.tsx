import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Book, BarChart2, Layout, Activity, Wallet, Search } from "lucide-react";

export default function Docs() {
  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-10">

      {/* Introduction Section */}
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          BlocRA Documentation
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Welcome to BlocRA (Blockchain Research Analysis), your all-in-one platform for Starknet analytics, contract exploration, and custom dashboard creation.
        </p>
      </section>

      <Separator />

      {/* Key Features Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Key Features</h2>
        <div className="grid gap-6 md:grid-cols-3">

          <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Search className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Contract EDA</CardTitle>
              <CardDescription>Exploratory Data Analysis for Contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Deep dive into any Starknet contract. Analyze event logs, transaction history, and unique interactions to understand contract behavior and user engagement.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Layout className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Dashboard Builder</CardTitle>
              <CardDescription>Create Custom Analytics Views</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Build your own professional dashboards using a drag-and-drop interface. Add charts, KPI widgets, and heatmaps tailored to your specific monitoring needs.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Activity className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Network Stats</CardTitle>
              <CardDescription>Real-time Network Monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Stay updated with live network metrics including block times, gas fees, transaction throughput, and active wallet growth across the Starknet ecosystem.
              </p>
            </CardContent>
          </Card>

        </div>
      </section>

      <Separator />

      {/* Getting Started Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Book className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">Getting Started</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-xl font-medium">1. Connect Your Wallet</h3>
            <p className="text-muted-foreground">
              Click the wallet icon in the top right corner to connect your Argent or Braavos wallet. This allows you to interact with the blockchain and save your custom dashboards.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">2. Explore a Contract</h3>
            <p className="text-muted-foreground">
              Navigate to the "Contract EDA" page. Paste a valid Starknet contract address to fetch and visualize its historical event data and transaction patterns.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">3. Build a Dashboard</h3>
            <p className="text-muted-foreground">
              Go to "Dashboard Builder". Click "Create New Dashboard", give it a name, and start adding widgets. You can resize and rearrange them to fit your workflow.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">4. Monitor Network</h3>
            <p className="text-muted-foreground">
              The main "Dashboard" gives you a high-level overview of the Starknet network health. Check here for gas spikes or network congestion.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* FAQ Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full">

          <AccordionItem value="item-1">
            <AccordionTrigger>Is BlocRA free to use?</AccordionTrigger>
            <AccordionContent>
              Yes, BlocRA is currently free to use for all public analytics features. Some advanced features may require a premium subscription in the future.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>Which wallets are supported?</AccordionTrigger>
            <AccordionContent>
              We currently support Argent X and Braavos wallets for the Starknet ecosystem.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>Can I export my data?</AccordionTrigger>
            <AccordionContent>
              Yes, specific widgets and the Contract EDA tool allow you to export the visualized data as CSV or JSON files for offline analysis.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>How accurate is the data?</AccordionTrigger>
            <AccordionContent>
              We fetch data directly from Starknet RPC nodes and indexers. While we strive for real-time accuracy, there may be slight delays depending on network conditions.
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </section>

    </div>
  );
}