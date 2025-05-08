'use client';

import { useState, useEffect } from 'react';

/**
 * SafeHydration component prevents hydration mismatch errors by not rendering
 * children until the component has mounted on the client.
 * 
 * This is useful for components that access browser APIs or have different
 * behavior on client vs server.
 */
export default function SafeHydration({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated ? children : null;
} 