import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/sql" component={Home} />
    <Route path="/xss" component={Home} />
    <Route path="/idor" component={Home} />
    <Route path="/auth" component={Home} />
    <Route path="/access" component={Home} />
    <Route path="/upload" component={Home} />
    <Route path="/csrf" component={Home} />
    <Route path="/misconfig" component={Home} />
    <Route path="/session" component={Home} />
    <Route path="/tracker" component={Home} />
    <Route path="/methodology" component={Home} />
    <Route path="/recon" component={Home} />
    <Route path="/report" component={Home} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary>
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </ThemeProvider>
  </ErrorBoundary>;
}

export default App;
