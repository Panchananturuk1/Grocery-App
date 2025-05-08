import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import DbStatus from '../components/debug/DbStatus';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'OrderKaro - Grocery Delivery',
  description: 'Quick grocery delivery at your doorstep',
};

export default function RootLayout({ children }) {
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';
  
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
        {isDev && <DbStatus />}
      </body>
    </html>
  );
} 