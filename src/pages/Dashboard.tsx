import React from 'react';
import { Search, Bell, FileText, Settings, Menu, X, User, CreditCard, Building, Bookmark } from 'lucide-react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import NotificationSettings from './dashboard/NotificationSettings';
import BusinessPlan from './dashboard/BusinessPlan';
import SettingsPage from './dashboard/Settings';
import SupportPrograms from './dashboard/SupportPrograms';
import AccountManagement from './dashboard/AccountManagement';
import Billing from './dashboard/Billing';
import CreateBusinessPlanA from './dashboard/CreateBusinessPlanA';
import Bookmarks from './dashboard/Bookmarks';
import logo from '../assets/기발자들.png';

export default function Dashboard() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isActivePath = (path: string) => {
    return location.pathname === path || 
           (path !== '/dashboard' && location.pathname.startsWith(path));
  };

  const getNavClass = (path: string) => {
    return `flex items-center space-x-3 p-3 rounded-lg ${
      isActivePath(path)
        ? 'text-blue-600 bg-blue-50'
        : 'text-gray-700 hover:bg-gray-50'
    }`;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold gradient-text">
            <img src={logo} alt="기발자들" className="h-8 w-auto" />
          </h1>
          <button onClick={toggleMobileMenu} className="p-2">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Side Navigation - Desktop */}
      <nav className="hidden md:block fixed w-64 h-screen bg-white shadow-lg">
        <div className="p-6">
          <Link to="/" className="text-2xl font-bold gradient-text mb-8 block">
            <img src={logo} alt="기발자들" className="h-10 w-auto" />
          </Link>
          <ul className="space-y-4">
            <li>
              <Link to="/dashboard" className={getNavClass('/dashboard')} onClick={() => setIsMobileMenuOpen(false)}>
                <Search className="w-5 h-5" />
                <span>지원사업 검색</span>
              </Link>
            </li>
            <li>
              <Link to="/dashboard/bookmarks" className={getNavClass('/dashboard/bookmarks')} onClick={() => setIsMobileMenuOpen(false)}>
                <Bookmark className="w-5 h-5" />
                <span>북마크</span>
              </Link>
            </li>
            <li>
              <Link to="/dashboard/notifications" className={getNavClass('/dashboard/notifications')} onClick={() => setIsMobileMenuOpen(false)}>
                <Bell className="w-5 h-5" />
                <span>알림 설정</span>
              </Link>
            </li>
            <li>
              <Link to="/dashboard/business-plan" className={getNavClass('/dashboard/business-plan')} onClick={() => setIsMobileMenuOpen(false)}>
                <FileText className="w-5 h-5" />
                <span>사업계획서</span>
              </Link>
            </li>
            <li>
              <Link to="/dashboard/account" className={getNavClass('/dashboard/account')} onClick={() => setIsMobileMenuOpen(false)}>
                <User className="w-5 h-5" />
                <span>계정 관리</span>
              </Link>
            </li>
            <li>
              <Link to="/dashboard/billing" className={getNavClass('/dashboard/billing')} onClick={() => setIsMobileMenuOpen(false)}>
                <CreditCard className="w-5 h-5" />
                <span>결제</span>
              </Link>
            </li>
            <li>
              <Link to="/dashboard/settings" className={getNavClass('/dashboard/settings')} onClick={() => setIsMobileMenuOpen(false)}>
                <Settings className="w-5 h-5" />
                <span>설정</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <nav className="md:hidden fixed top-[64px] left-0 right-0 bottom-0 bg-white shadow-lg z-40">
          <div className="p-6">
            <ul className="space-y-4">
              <li>
                <Link to="/dashboard" className={getNavClass('/dashboard')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Search className="w-5 h-5" />
                  <span>지원사업 검색</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard/bookmarks" className={getNavClass('/dashboard/bookmarks')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Bookmark className="w-5 h-5" />
                  <span>북마크</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard/notifications" className={getNavClass('/dashboard/notifications')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Bell className="w-5 h-5" />
                  <span>알림 설정</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard/business-plan" className={getNavClass('/dashboard/business-plan')} onClick={() => setIsMobileMenuOpen(false)}>
                  <FileText className="w-5 h-5" />
                  <span>사업계획서</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard/account" className={getNavClass('/dashboard/account')} onClick={() => setIsMobileMenuOpen(false)}>
                  <User className="w-5 h-5" />
                  <span>계정 관리</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard/billing" className={getNavClass('/dashboard/billing')} onClick={() => setIsMobileMenuOpen(false)}>
                  <CreditCard className="w-5 h-5" />
                  <span>결제</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard/settings" className={getNavClass('/dashboard/settings')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Settings className="w-5 h-5" />
                  <span>설정</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div className="md:ml-64 p-4 md:p-8 mt-16 md:mt-0">
        <Routes>
          <Route index element={<SupportPrograms />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="notifications" element={<NotificationSettings />} />
          <Route path="business-plan" element={<BusinessPlan />} />
          <Route path="business-plan/create" element={<CreateBusinessPlanA />} />
          <Route path="account" element={<AccountManagement />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </div>
  );
}