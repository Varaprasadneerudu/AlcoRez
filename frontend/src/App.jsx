import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StatutoryBanner from './components/StatutoryBanner';
import LegalAgeModal from './components/LegalAgeModal';
import AppRoutes from './routes/AppRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <BrowserRouter>
            <AuthProvider>
              <CartProvider>
                <div className="flex flex-col min-h-screen bg-[#FBF9F5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
                  {/* Mandatory 21+ Statutory Age Verification Modal */}
                  <LegalAgeModal />

                  {/* Persistent Excise Compliance Banner */}
                  <StatutoryBanner />

                  {/* Header / Navbar */}
                  <Navbar />

                  {/* Page Contents */}
                  <main className="flex-1">
                    <AppRoutes />
                  </main>

                  {/* Footer with Statutory Health Warning */}
                  <Footer />
                </div>
              </CartProvider>
            </AuthProvider>
          </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
