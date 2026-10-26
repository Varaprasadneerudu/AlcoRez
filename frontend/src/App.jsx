import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
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
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen bg-[#FBF9F5]">
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
    </QueryClientProvider>
  );
}
