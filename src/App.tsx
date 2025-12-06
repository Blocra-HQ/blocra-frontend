import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeController } from "@/components/ThemeController";
import { ChainProvider } from "@/contexts/ChainContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Core pages (immediately loaded)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazily loaded pages
const ContractEventsEDA = lazy(() => import("./pages/ContractEventsEDA"));
const Docs = lazy(() => import("./pages/Docs"));
const Profile = lazy(() => import("./pages/Profile"));
const CreateBounty = lazy(() => import("./pages/CreateBounty"));
const QueryEditor = lazy(() => import("./pages/QueryEditor"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Bounties = lazy(() => import("./pages/Bounties"));
const DashboardBuilder = lazy(() => import("./pages/DashboardBuilder"));
const DashboardEdit = lazy(() => import("./pages/DashboardEdit"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PublicDashboard = lazy(() => import("./pages/PublicDashboard"));
const Charts = lazy(() => import("./pages/Charts"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Settings = lazy(() => import("./pages/Settings"));
const JoinBounty = lazy(() => import("./pages/JoinBounty"));
const PlaceBounty = lazy(() => import("./pages/PlaceBounty"));
const SystemStatus = lazy(() => import("./pages/SystemStatus"));
const DataExplorerPage = lazy(() => import("./pages/DataExplorerPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const MyBounties = lazy(() => import("./pages/MyBounties"));
const BountyStats = lazy(() => import("./pages/BountyStats"));
const SubmitBounty = lazy(() => import("./pages/SubmitBounty"));
const GoogleCallback = lazy(() => import("./pages/auth/GoogleCallback"));
const GithubCallback = lazy(() => import("./pages/auth/GithubCallback"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ChainProvider>
          <ThemeController />
          <AuthProvider>
            <SidebarProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppLayout>
                    <Suspense fallback={
                      <div className="flex items-center justify-center min-h-screen">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      </div>
                    }>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/auth" element={
                          <ProtectedRoute requireAuth={false}>
                            <Auth />
                          </ProtectedRoute>
                        } />
                        <Route path="/auth/google/callback" element={<GoogleCallback />} />
                        <Route path="/auth/github/callback" element={<GithubCallback />} />

                        <Route path="/docs" element={
                          <Docs />
                        } />

                        {/* Protected routes */}
                        <Route path="/" element={
                          <ProtectedRoute>
                            <Index />
                          </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        } />
                        <Route path="/join-bounty" element={
                          <ProtectedRoute>
                            <JoinBounty />
                          </ProtectedRoute>
                        } />
                        <Route path="/place-bounty" element={
                          <ProtectedRoute>
                            <PlaceBounty />
                          </ProtectedRoute>
                        } />
                        <Route path="/create-bounty" element={
                          <ProtectedRoute>
                            <CreateBounty />
                          </ProtectedRoute>
                        } />
                        <Route path="/data-explorer" element={
                          <ProtectedRoute>
                            <DataExplorerPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/query" element={
                          <ProtectedRoute>
                            <QueryEditor />
                          </ProtectedRoute>
                        } />
                        <Route path="/queries/new" element={
                          <ProtectedRoute>
                            <QueryEditor />
                          </ProtectedRoute>
                        } />
                        <Route path="/library/:type" element={
                          <ProtectedRoute>
                            <LibraryPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/library" element={
                          <ProtectedRoute>
                            <LibraryPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/admin" element={<AdminLogin />} />
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/analytics" element={
                          <ProtectedRoute>
                            <Analytics />
                          </ProtectedRoute>
                        } />
                        <Route path="/bounties" element={
                          <ProtectedRoute>
                            <Bounties />
                          </ProtectedRoute>
                        } />
                        <Route path="/builder" element={
                          <ProtectedRoute>
                            <DashboardBuilder />
                          </ProtectedRoute>
                        } />
                        <Route path="/builder/edit/:id" element={
                          <ProtectedRoute>
                            <DashboardEdit />
                          </ProtectedRoute>
                        } />
                        <Route path="/dashboard/:username/:slug" element={
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/d/:username/:slug" element={<PublicDashboard />} />
                        <Route path="/charts" element={
                          <ProtectedRoute>
                            <Charts />
                          </ProtectedRoute>
                        } />
                        <Route path="/wallet" element={
                          <ProtectedRoute>
                            <Wallet />
                          </ProtectedRoute>
                        } />
                        <Route path="/contract-events-eda" element={
                          <ProtectedRoute>
                            <ContractEventsEDA />
                          </ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        } />
                        <Route path="/status" element={
                          <ProtectedRoute>
                            <SystemStatus />
                          </ProtectedRoute>
                        } />
                        <Route path="/my-bounties" element={
                          <ProtectedRoute>
                            <MyBounties />
                          </ProtectedRoute>
                        } />
                        <Route path="/bounty-stats" element={
                          <ProtectedRoute>
                            <BountyStats />
                          </ProtectedRoute>
                        } />
                        <Route path="/bounty/:bountyId/submit" element={
                          <ProtectedRoute>
                            <SubmitBounty />
                          </ProtectedRoute>
                        } />

                        {/* Catch-all route */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </AppLayout>
                </BrowserRouter>
              </TooltipProvider>
            </SidebarProvider>
          </AuthProvider>
        </ChainProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
