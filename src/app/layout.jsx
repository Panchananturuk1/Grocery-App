'use client';

// Import logger initialization at the very beginning
import '../utils/init-logger';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import Providers from "../providers/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Toaster 
            position="top-center" 
            toastOptions={{
              // Default options for all toasts
              duration: 2500,
              style: {
                maxWidth: '500px',
              },
              // Custom styling for each toast type
              success: {
                duration: 2000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: 'white',
                },
              },
              error: {
                duration: 3000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: 'white',
                },
              },
              // Limit the number of toasts displayed
              loading: {
                duration: 10000,
              },
            }}
            // Limit number of toasts visible at once
            gutter={8}
            limit={3}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
} 