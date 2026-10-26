import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import HomePage from '../pages/HomePage';
import CatalogPage from '../pages/CatalogPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import CartPage from '../pages/CartPage';
import CheckoutDemoPage from '../pages/CheckoutDemoPage';
import OrderConfirmationPage from '../pages/OrderConfirmationPage';
import OrdersHistoryPage from '../pages/OrdersHistoryPage';
import ComplianceInfoPage from '../pages/ComplianceInfoPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

// Retailer Pages
import RetailerDashboard from '../pages/retailer/RetailerDashboard';
import RetailerInventoryPage from '../pages/retailer/RetailerInventoryPage';
import RetailerOrdersPage from '../pages/retailer/RetailerOrdersPage';
import RetailerApplyPage from '../pages/retailer/RetailerApplyPage';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminRetailersPage from '../pages/admin/AdminRetailersPage';
import AdminAuditPage from '../pages/admin/AdminAuditPage';
import AdminCompliancePage from '../pages/admin/AdminCompliancePage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Customer Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<CatalogPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/categories/:slug" element={<CatalogPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout-demo" element={<CheckoutDemoPage />} />
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
  );
}
