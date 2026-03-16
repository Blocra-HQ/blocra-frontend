import { Suspense, lazy, useEffect } from 'react';
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
import "@/utils/debug"; // Load debug utilities

// Core pages (immediately loaded)
import Index from "./pages/Index";
// import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazily loaded pages - Core features only
const ContractEventsEDA = lazy(() => import("./pages/ContractEventsEDA"));
const QueryEditor = lazy(() => import("./pages/QueryEditor"));
const Docs = lazy(() => import("./pages/Docs"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const DataExplorerPage = lazy(() => import("./pages/DataExplorerPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const GoogleCallback = lazy(() => import("./pages/auth/GoogleCallback"));

// Bounty features - consolidated
const Bounties = lazy(() => import("./pages/Bounties"));
const CreateBounty = lazy(() => import("./pages/CreateBounty"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DashboardBuilder = lazy(() => import("./pages/DashboardBuilder"));

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
                        {/* <Route path="/auth" element={
                          <ProtectedRoute requireAuth={false}>
                            <Auth />
                          </ProtectedRoute>
                        } />
                        <Route path="/auth/google/callback" element={<GoogleCallback />} /> */}

                        <Route path="/docs" element={
                          <Docs />
                        } />

                        {/* Landing page - now public */}
                        <Route path="/" element={
                          <Index />
                        } />
                        {/* Other pages - now public */}
                        <Route path="/profile" element={
                          <Profile />
                        } />
                        <Route path="/bounties/create" element={
                          <CreateBounty />
                        } />
                        <Route path="/data-explorer" element={
                          <DataExplorerPage />
                        } />
                        <Route path="/query" element={
                          <QueryEditor />
                        } />
                        <Route path="/queries/new" element={
                          <QueryEditor />
                        } />
                        <Route path="/library/:type" element={
                          <LibraryPage />
                        } />
                        <Route path="/library" element={
                          <LibraryPage />
                        } />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/bounties" element={
                          <Bounties />
                        } />
                        <Route path="/contract-events-eda" element={
                          <ContractEventsEDA />
                        } />
                        <Route path="/settings" element={
                          <Settings />
                        } />
                        <Route path="/builder" element={
                          <DashboardBuilder />
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
