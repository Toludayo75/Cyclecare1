import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ArticlesList from "@/pages/articles/index";
import NewArticle from "@/pages/articles/new";
import EditArticle from "@/pages/articles/edit";
import UsersList from "@/pages/users/index";
import UserDetail from "@/pages/users/detail";
import NgoList from "@/pages/ngos/index";
import NewNgo from "@/pages/ngos/new";
import CashDonationsPage from "@/pages/cash-donations";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      
      <Route path="/login" component={Login} />
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedLayout><Dashboard /></ProtectedLayout>
      </Route>
      
      <Route path="/articles">
        <ProtectedLayout><ArticlesList /></ProtectedLayout>
      </Route>
      <Route path="/articles/new">
        <ProtectedLayout><NewArticle /></ProtectedLayout>
      </Route>
      <Route path="/articles/:id/edit">
        <ProtectedLayout><EditArticle /></ProtectedLayout>
      </Route>
      
      <Route path="/users">
        <ProtectedLayout><UsersList /></ProtectedLayout>
      </Route>
      <Route path="/users/:id">
        <ProtectedLayout><UserDetail /></ProtectedLayout>
      </Route>
      
      <Route path="/ngos">
        <ProtectedLayout><NgoList /></ProtectedLayout>
      </Route>
      <Route path="/ngos/new">
        <ProtectedLayout><NewNgo /></ProtectedLayout>
      </Route>
      <Route path="/cash-donations">
        <ProtectedLayout><CashDonationsPage /></ProtectedLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
