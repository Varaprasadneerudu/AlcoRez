import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { LocationProvider } from './context/LocationContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { Navbar, Footer, StatutoryBanner, ScrollToTop } from './components/layout';
import { LegalAgeModal, CartDrawer } from './components/modals';
import AppRoutes from './routes/AppRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
});

function SessionNotice() {
  const { sessionError, retrySession } = useAuth();
  if (!sessionError) return null;
  return (
    <div role="alert" className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      {sessionError} <button type="button" onClick={retrySession} className="ml-2 font-bold underline underline-offset-2">Retry</button>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <BrowserRouter>
            {/* Reset scroll position to top whenever navigating to a new page */}
            <ScrollToTop />

            <LocationProvider>
              <AuthProvider>
                <FavoritesProvider>
                  <CartProvider>
                    <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-clip bg-[#FBF9F5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
                      {/* Mandatory 21+ Statutory Age Verification Modal */}
                      <LegalAgeModal />

                      {/* Unified Sticky Header: eliminates gap between Banner & Navbar during scrolling */}
                      <div className="sticky top-0 z-40 w-full shadow-xs">
                        <StatutoryBanner />
                        <Navbar />
                      </div>
                      <SessionNotice />

                      {/* Direction 3 Quick-Reserve Cart Drawer */}
                      <CartDrawer />

                      {/* Page Contents */}
                      <main className="flex-1">
                        <AppRoutes />
                      </main>

                      {/* Footer with Statutory Health Warning */}
                      <Footer />
                    </div>
                  </CartProvider>
                </FavoritesProvider>
              </AuthProvider>
            </LocationProvider>
          </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
