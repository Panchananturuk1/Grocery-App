'use client';

import Header from './Header';
import Footer from './Footer';
import ErrorBoundary from '../ErrorBoundary';
import AuthErrorBoundary from '../AuthErrorBoundary';

export default function MainLayout({ children }) {
  return (
    <ErrorBoundary>
      <AuthErrorBoundary>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </AuthErrorBoundary>
    </ErrorBoundary>
  );
} 