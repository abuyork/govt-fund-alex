import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const { resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if URL contains hash parameters which indicate an auth flow
    const hash = window.location.hash;
    
    if (hash) {
      // The type=recovery comes from Supabase when it's a password reset link
      if (hash.includes('type=recovery') && hash.includes('access_token')) {
        setIsResetMode(true);
      } 
      // Handle errors in the URL hash
      else if (hash.includes('error=') && hash.includes('error_code=otp_expired')) {
        setError('비밀번호 재설정 링크가 만료되었습니다. 새 링크를 요청해주세요.');
      } 
      else if (hash.includes('error=')) {
        setError('링크가 유효하지 않습니다. 새 링크를 요청해주세요.');
      }
    }
    
    // Listen for hash changes in the URL (back/forward navigation)
    const handleHashChange = () => {
      const newHash = window.location.hash;
      if (newHash.includes('type=recovery') && newHash.includes('access_token')) {
        setIsResetMode(true);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [location]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('이메일 주소를 입력해주세요');
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setMessage('비밀번호 재설정 링크가 이메일로 전송되었습니다. 1시간 이내에 링크를 사용해주세요.');
      setEmail('');
    } catch (err) {
      setError('예상치 못한 오류가 발생했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }
    
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await updatePassword(password);
      
      if (error) {
        // Check for specific error conditions
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          setError('비밀번호 재설정 세션이 만료되었습니다. 새 링크를 요청해주세요.');
        } else {
          setError(error.message);
        }
        return;
      }
      
      setMessage('비밀번호가 성공적으로 변경되었습니다');
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError('비밀번호 변경에 실패했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // If link has expired, show only the email request form
  if (error && (error.includes('만료') || error.includes('유효하지 않'))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              비밀번호 재설정
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              이메일을 입력하시면 새로운 비밀번호 재설정 링크를 보내드립니다
            </p>
          </div>
          
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleRequestReset}>
            <div>
              <label htmlFor="email-address" className="sr-only">
                이메일 주소
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  로그인으로 돌아가기
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400"
              >
                {loading ? '전송 중...' : '비밀번호 재설정 링크 요청'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {isResetMode ? '새 비밀번호 설정' : '비밀번호 재설정'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isResetMode ? 
              '새로운 비밀번호를 입력해주세요' : 
              '이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다 (1시간 유효)'}
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        {message && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">{message}</div>
          </div>
        )}
        
        {isResetMode ? (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="sr-only">
                  새 비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="새 비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  비밀번호 확인
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="비밀번호 확인"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400"
              >
                {loading ? '처리 중...' : '비밀번호 변경'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleRequestReset}>
            <div>
              <label htmlFor="email-address" className="sr-only">
                이메일 주소
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  로그인으로 돌아가기
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400"
              >
                {loading ? '전송 중...' : '비밀번호 재설정'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 