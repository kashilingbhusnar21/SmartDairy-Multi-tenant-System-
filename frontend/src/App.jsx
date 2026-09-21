import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LandingPage from './pages/LandingPage';
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
import FinancialLedgerPage from './pages/FinancialLedgerPage';
import FinancialAnalyticsPage from './pages/FinancialAnalyticsPage';
import AdminPage from './pages/AdminPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import FarmerDashboardPage from './pages/FarmerDashboardPage';
import FarmerProfilePage from './pages/FarmerProfilePage';
import FarmerMilkCollectionsPage from './pages/FarmerMilkCollectionsPage';
import FarmerPaymentsPage from './pages/FarmerPaymentsPage';
import FarmerFeedPurchasesPage from './pages/FarmerFeedPurchasesPage';
import FarmerAIChatPage from './pages/FarmerAIChatPage';
import AdminAIChatPage from './pages/AdminAIChatPage';
import AdminDoctorsPage from './pages/AdminDoctorsPage';
import FarmerDoctorsPage from './pages/FarmerDoctorsPage';
import AdminVendorsPage from './pages/AdminVendorsPage';
import AdminEquipmentPage from './pages/AdminEquipmentPage';
import FarmerVendorsPage from './pages/FarmerVendorsPage';
import FarmerEquipmentListPage from './pages/FarmerEquipmentListPage';
import FarmerEquipmentDetailPage from './pages/FarmerEquipmentDetailPage';
import ProtectedOutlet from './components/ProtectedOutlet';
import AdminOutlet from './components/AdminOutlet';
import FarmerOutlet from './components/FarmerOutlet';
//import Layout from './components/Layout';
import DashboardLayout from './components/layout/DashboardLayout';
import FarmerLayout from './components/layout/FarmerLayout';
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes - Admin */}
        <Route element={<ProtectedOutlet />}>
          <Route element={<AdminOutlet />}>
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
              <Route path="/financial-ledger" element={<FinancialLedgerPage />} />
              <Route path="/financial-analytics" element={<FinancialAnalyticsPage />} />
              <Route path="/farmers/:farmerId/bill" element={<FarmerBillPage />} />
              <Route path="/farmers/:farmerId/payments" element={<FarmerPaymentHistoryPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
              <Route path="/admin/vendors" element={<AdminVendorsPage />} />
              <Route path="/admin/equipment" element={<AdminEquipmentPage />} />
              <Route path="/admin/ai-chat" element={<AdminAIChatPage />} />
            </Route>
          </Route>
        </Route>

        {/* Protected routes - Farmer */}
        <Route element={<ProtectedOutlet />}>
          <Route element={<FarmerOutlet />}>
            <Route element={<FarmerLayout />}>
              <Route path="/farmer/dashboard" element={<FarmerDashboardPage />} />
              <Route path="/farmer/profile" element={<FarmerProfilePage />} />
              <Route path="/farmer/milk-collections" element={<FarmerMilkCollectionsPage />} />
              <Route path="/farmer/payments" element={<FarmerPaymentsPage />} />
              <Route path="/farmer/feed-purchases" element={<FarmerFeedPurchasesPage />} />
              <Route path="/farmer/doctors" element={<FarmerDoctorsPage />} />
              <Route path="/farmers/vendors" element={<FarmerVendorsPage />} />
              <Route path="/farmers/equipment/vendor/:vendorId" element={<FarmerEquipmentListPage />} />
              <Route path="/farmers/equipment/:id" element={<FarmerEquipmentDetailPage />} />
              <Route path="/farmer/ai-chat" element={<FarmerAIChatPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;