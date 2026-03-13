import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DatabaseProvider } from "@/contexts/DatabaseContext";
import { AppShell } from "@/components/AppShell";
import { QueryProvider } from "@/components/QueryProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DBOS Workflows Admin",
  description: "List, view, and debug DBOS durable workflows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased relative">
        <QueryProvider>
          <DatabaseProvider>
            <AppShell>{children}</AppShell>
          </DatabaseProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
