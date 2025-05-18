import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { lazyLoad } from './utils/lazyLoad';
import { AuthProvider } from './contexts/AuthContext'; // Restored for mock auth
import { GovSupportProvider } from './contexts/GovSupportContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

// Lazy load components for better performance
const Landing = lazyLoad(() => import('./pages/Landing'));
const Dashboard = lazyLoad(() => import('./pages/Dashboard'));
const Pricing = lazyLoad(() => import('./pages/Pricing'));
const Admin = lazyLoad(() => import('./pages/Admin'));
const SupportSearch = lazyLoad(() => import('./pages/SupportSearch'));
const Login = lazyLoad(() => import('./pages/Login'));
const Signup = lazyLoad(() => import('./pages/Signup'));
const ResetPassword = lazyLoad(() => import('./pages/ResetPassword'));
const AuthCallback = lazyLoad(() => import('./pages/AuthCallback'));
// const ProtectedRoute = lazyLoad(() => import('./components/ProtectedRoute'));  // Commented out for development
const Test = lazyLoad(() => import('./pages/Test'));
const PaymentSuccess = lazyLoad(() => import('./pages/payment/PaymentSuccess'));
const PaymentFail = lazyLoad(() => import('./pages/payment/PaymentFail'));
// const Company = lazyLoad(() => import('./pages/Company'));
const PrivacyPolicy = lazyLoad(() => import('./pages/PrivacyPolicy'));
const TermsOfUse = lazyLoad(() => import('./pages/TermsOfUse'));

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <GovSupportProvider>
          <Router>
            <Toaster position="top-right" />
            <Routes>
              <Route path="/" element={
                <>
                  <Header />
                  <Landing />
                  <Footer />
                </>
              } />
              <Route path="/pricing" element={
                <>
                  <Header />
                  <Pricing />
                  <Footer />
                </>
              } />
              {/* Protected Dashboard route */}
              <Route path="/dashboard/*" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              {/* Protected Admin route - only for admins */}
              <Route path="/admin/*" element={
                <ProtectedAdminRoute>
                  <Admin />
                </ProtectedAdminRoute>
              } />
              <Route path="/support-search" element={
                <>
                  <Header />
                  <SupportSearch />
                  <Footer />
                </>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/test" element={<Test />} />
              
              {/* Payment Routes */}
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/fail" element={<PaymentFail />} />
              
              {/* Privacy Policy and Terms of Use routes */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-use" element={<TermsOfUse />} />
            </Routes>
          </Router>
        </GovSupportProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;