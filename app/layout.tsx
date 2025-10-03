import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, User, TestTube, Home, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ToastProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RFP Hunter v2.0 - 90% Accuracy",
  description: "AI-powered RFP analysis with company profiling for accurate GO/NO-GO decisions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="border-b bg-white sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-xl">RFP Hunter</span>
                <Badge variant="secondary" className="ml-2">v2.0</Badge>
              </Link>
              
              <div className="hidden md:flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Home className="w-4 h-4" />
                    Analyze
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </Button>
                </Link>
                {isDevelopment && (
                  <>
                    <Link href="/test">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <TestTube className="w-4 h-4" />
                        Test RFPs
                      </Button>
                    </Link>
                    <Link href="/test-harness">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <FlaskConical className="w-4 h-4" />
                        Test Harness
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isDevelopment && (
                <Badge variant="outline" className="hidden md:inline-flex">
                  Development Mode
                </Badge>
              )}
            </div>
          </div>
        </nav>
        
        <main className="min-h-[calc(100vh-4rem)]">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        <ToastProvider />
      </body>
    </html>
  );
}
