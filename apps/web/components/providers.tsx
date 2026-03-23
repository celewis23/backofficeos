"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "bg-popover text-popover-foreground border border-border shadow-lg rounded-lg",
              title: "text-sm font-medium",
              description: "text-xs text-muted-foreground",
              actionButton: "bg-primary text-primary-foreground text-xs",
              cancelButton: "bg-muted text-muted-foreground text-xs",
              error: "border-destructive/30 bg-destructive/5",
              success: "border-success/30 bg-success/5",
              warning: "border-warning/30 bg-warning/5",
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
