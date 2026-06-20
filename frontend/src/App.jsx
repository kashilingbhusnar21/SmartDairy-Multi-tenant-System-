import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import FarmerListPage from './pages/FarmerListPage';
import FarmerFormPage from './pages/FarmerFormPage';
import MilkCollectionListPage from './pages/MilkCollectionListPage';
import MilkCollectionFormPage from './pages/MilkCollectionFormPage';
import AdvancedMilkReportsPage from './pages/AdvancedMilkReportsPage';
import PaymentFormPage from './pages/PaymentFormPage';
import PaymentDashboardPage from './pages/PaymentDashboardPage';
import FeedPurchasesPage from './pages/FeedPurchasesPage';
import FarmerBillPage from './pages/FarmerBillPage';
import FarmerPaymentHistoryPage from './pages/FarmerPaymentHistoryPage';
import AdminPage from './pages/AdminPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import ProtectedOutlet from './components/ProtectedOutlet';
import AdminOutlet from './components/AdminOutlet';
//import Layout from './components/Layout';
import DashboardLayout from './components/layout/DashboardLayout';
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected routes */}
        <Route element={<ProtectedOutlet />}>
          <Route element={<DashboardLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/dashboard" element={<HomePage />} />
            <Route path="/farmers" element={<FarmerListPage />} />
            <Route path="/farmers/add" element={<FarmerFormPage />} />
            <Route path="/farmers/:id/edit" element={<FarmerFormPage />} />
            <Route path="/milk-collections" element={<MilkCollectionListPage />} />
            <Route path="/milk-collections/add" element={<MilkCollectionFormPage />} />
            <Route path="/milk-collections/:id/edit" element={<MilkCollectionFormPage />} />
            <Route path="/milk-reports" element={<AdvancedMilkReportsPage />} />
            <Route path="/payments" element={<PaymentDashboardPage />} />
            <Route path="/payments/add" element={<PaymentFormPage />} />
            <Route path="/feed-purchases" element={<FeedPurchasesPage />} />
            <Route path="/farmers/:farmerId/bill" element={<FarmerBillPage />} />
            <Route path="/farmers/:farmerId/payments" element={<FarmerPaymentHistoryPage />} />

            {/* Admin routes */}
            <Route element={<AdminOutlet />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;