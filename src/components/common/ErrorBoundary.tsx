import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { AlertOctagon, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Layout>
          <div className="container py-20 max-w-md mx-auto">
            <Card className="border-red-500/20 shadow-xl border-2">
              <CardContent className="pt-8 text-center space-y-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 mx-auto text-red-600">
                  <AlertOctagon className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
                  <p className="text-sm text-muted-foreground">
                    An unexpected rendering error occurred while loading this page.
                  </p>
                  {this.state.error?.message && (
                    <div className="p-3 bg-muted rounded-lg text-xs font-mono text-left break-all text-muted-foreground border border-muted">
                      {this.state.error.message}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reload Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </Layout>
      );
    }

    return this.props.children;
  }
}
