import type { Metadata, Viewport } from "next";
import { fontInter, fontMono } from "@/lib/fonts";
import { Providers } from "@/components/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BackOfficeOS",
    template: "%s — BackOfficeOS",
  },
  description: "The operating system for your business. Everything your team needs in one place.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontInter.variable} ${fontMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <TooltipProvider delayDuration={300}>
            {children}
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
