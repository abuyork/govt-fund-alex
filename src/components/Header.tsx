import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import logo from '../assets/기발자들.png';

export default function Header() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('로그아웃 되었습니다');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('로그아웃 중 오류가 발생했습니다');
    }
  };

  return (
    <header className="fixed w-full bg-white/80 backdrop-blur-md z-50 shadow-sm">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold gradient-text">
            <img src={logo} alt="기발자들" className="h-10 w-auto" />
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600">홈</Link>
            <Link to="/pricing" className="text-gray-700 hover:text-blue-600">요금제</Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700">
                  대시보드
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                    <User size={20} />
                    <span>{user.email?.split('@')[0]}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link to="/dashboard/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">계정 관리</Link>
                    <Link to="/dashboard/notifications" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">알림 설정</Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                      로그아웃
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-blue-600">로그인</Link>
                <Link to="/signup" className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700">
                  회원가입
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 space-y-4">
            <Link to="/" className="block text-gray-700 hover:text-blue-600">홈</Link>
            <Link to="/pricing" className="block text-gray-700 hover:text-blue-600">요금제</Link>
            
            {user ? (
              <>
                <Link to="/dashboard" className="block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 text-center">
                  대시보드
                </Link>
                <Link to="/dashboard/account" className="block text-gray-700 hover:text-blue-600">계정 관리</Link>
                <Link to="/dashboard/notifications" className="block text-gray-700 hover:text-blue-600">알림 설정</Link>
                <button onClick={handleLogout} className="block w-full text-left text-red-600 hover:text-red-700">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-gray-700 hover:text-blue-600">로그인</Link>
                <Link to="/signup" className="block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 text-center">
                  회원가입
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}