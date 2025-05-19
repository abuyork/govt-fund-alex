import { Bell, CreditCard, LayoutTemplate, Menu, PieChart, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AdminProtectionWrapper from '../components/AdminProtectionWrapper';
import AdminClientDetail from './admin/AdminClientDetail';
import AdminClients from './admin/AdminClients';
import AdminPayments from './admin/AdminPayments';
import AdminStatistics from './admin/AdminStatistics';
import AdminTemplates from './admin/AdminTemplates';
import AdminUsers from './admin/AdminUsers';
import TemplateViewPage from './admin/TemplateViewPage';
import TestNotifications from './admin/TestNotifications';

export default function Admin() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActivePath = (path: string) => {
    return location.pathname === path ||
      (path !== '/admin' && location.pathname.startsWith(path));
  };

  const getNavClass = (path: string) => {
    return `flex items-center space-x-3 p-3 rounded-lg ${isActivePath(path)
        ? 'text-blue-600 bg-blue-50'
        : 'text-gray-700 hover:bg-gray-50'
      }`;
  };

  return (
    <AdminProtectionWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow z-10 p-4 flex justify-between items-center">
          <div className="font-bold text-xl">관리자 패널</div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-700"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className={`fixed top-0 left-0 h-full bg-white shadow-lg w-64 md:translate-x-0 transform transition-transform duration-200 ease-in-out z-20
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">관리자 패널</h2>
          </div>

          <nav className="p-4">
            <div className="space-y-2">
              <Link to="/admin/templates" className={getNavClass('/admin/templates')}>
                <LayoutTemplate className="w-5 h-5" />
                <span>템플릿 관리</span>
              </Link>
              <Link to="/admin/users" className={getNavClass('/admin/users')}>
                <Users className="w-5 h-5" />
                <span>사용자 관리</span>
              </Link>
              <Link to="/admin/clients" className={getNavClass('/admin/clients')}>
                <Users className="w-5 h-5" />
                <span>고객 관리</span>
              </Link>
              <Link to="/admin/payments" className={getNavClass('/admin/payments')}>
                <CreditCard className="w-5 h-5" />
                <span>결제 관리</span>
              </Link>
              <Link to="/admin/statistics" className={getNavClass('/admin/statistics')}>
                <PieChart className="w-5 h-5" />
                <span>통계</span>
              </Link>
              <Link to="/admin/test-notifications" className={getNavClass('/admin/test-notifications')}>
                <Bell className="w-5 h-5" />
                <span>알림 테스트</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="md:ml-64 p-4 md:p-8 mt-16 md:mt-0">
          <Routes>
            <Route index element={<Navigate to="/admin/templates" replace />} />
            <Route path="templates" element={<AdminTemplates />} />
            <Route path="templates/view/:id" element={<TemplateViewPage />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="clients/:id" element={<AdminClientDetail />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="statistics" element={<AdminStatistics />} />
            <Route path="test-notifications" element={<TestNotifications />} />
          </Routes>
        </div>
      </div>
    </AdminProtectionWrapper>
  );
}