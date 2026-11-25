import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Eagerly loaded for fast first-contentful-paint
import HomePage from '../pages/public/HomePage';

// Lazy-loaded public & info pages
const ComplianceInfoPage = lazy(() => import('../pages/public/ComplianceInfoPage'));

// Lazy-loaded auth pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));

// Lazy-loaded customer discovery & shopping pages
const CatalogPage = lazy(() => import('../pages/customer/CatalogPage'));
const ProductDetailPage = lazy(() => import('../pages/customer/ProductDetailPage'));
const CartPage = lazy(() => import('../pages/customer/CartPage'));
const CheckoutDemoPage = lazy(() => import('../pages/customer/CheckoutDemoPage'));
const OrderConfirmationPage = lazy(() => import('../pages/customer/OrderConfirmationPage'));
const OrdersPlacedPage = lazy(() => import('../pages/customer/OrdersPlacedPage'));
const OrdersHistoryPage = lazy(() => import('../pages/customer/OrdersHistoryPage'));
const FavoritesPage = lazy(() => import('../pages/customer/FavoritesPage'));
const RetailerDetailPage = lazy(() => import('../pages/customer/RetailerDetailPage'));

// Lazy-loaded retailer portal pages
const RetailerDashboard = lazy(() => import('../pages/retailer/RetailerDashboard'));
const RetailerInventoryPage = lazy(() => import('../pages/retailer/RetailerInventoryPage'));
const RetailerOrdersPage = lazy(() => import('../pages/retailer/RetailerOrdersPage'));
const RetailerApplyPage = lazy(() => import('../pages/retailer/RetailerApplyPage'));

// Lazy-loaded admin portal pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminRetailersPage = lazy(() => import('../pages/admin/AdminRetailersPage'));
const AdminAuditPage = lazy(() => import('../pages/admin/AdminAuditPage'));
const AdminCompliancePage = lazy(() => import('../pages/admin/AdminCompliancePage'));

/**
 * Fallback loader shown while route chunks are streamed
 */
function RouteSuspenseFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-9 h-9 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 animate-pulse">
        Loading view...
      </span>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteSuspenseFallback />}>
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<CatalogPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/categories/:slug" element={<CatalogPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/retailers/:id" element={<RetailerDetailPage />} />
        <Route path="/checkout-demo" element={<CheckoutDemoPage />} />
        <Route path="/orders/placed" element={<OrdersPlacedPage />} />
        <Route path="/orders/:id" element={<OrderConfirmationPage />} />
        <Route path="/orders" element={<OrdersHistoryPage />} />
        <Route path="/compliance-info" element={<ComplianceInfoPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Retailer Portal Routes */}
        <Route path="/retailer" element={<RetailerDashboard />} />
        <Route path="/retailer/inventory" element={<RetailerInventoryPage />} />
        <Route path="/retailer/orders" element={<RetailerOrdersPage />} />
        <Route path="/retailer/apply" element={<RetailerApplyPage />} />

        {/* Administrator Portal Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/retailers" element={<AdminRetailersPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditPage />} />
        <Route path="/admin/compliance" element={<AdminCompliancePage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
