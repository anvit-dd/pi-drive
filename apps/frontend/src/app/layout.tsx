"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Theme } from "@radix-ui/themes";
import TitleManager from "./components/TitleManager";
import ToastProvider from "../components/useToast";
import { ThemeProvider } from "../components/theme-provider";
import { ReactNode } from "react";

// Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider defaultTheme='system' storageKey='pi-drive-theme'>
          <Theme accentColor='crimson' appearance='inherit'>
            <ToastProvider>
              <TitleManager />
              {children}
            </ToastProvider>
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  );
}
