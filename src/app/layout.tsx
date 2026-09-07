import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DriveLuxe — Premium Car Rental",
  description:
    "Rent luxury and performance cars in seconds. Browse a curated fleet, book by the day, and drive away with DriveLuxe.",
  keywords: [
    "car rental",
    "luxury cars",
    "premium car hire",
    "sports car rental",
    "DriveLuxe",
  ],
  authors: [{ name: "DriveLuxe" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
