import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import Providers from "@/providers/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "OrderKaro - Grocery Delivery",
  description: "Your one-stop shop for all grocery needs delivered to your doorstep",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Toaster position="top-center" />
          {children}
        </Providers>
      </body>
    </html>
  );
} 