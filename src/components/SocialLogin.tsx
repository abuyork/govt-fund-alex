import { useState } from 'react';
import { Provider } from '@supabase/supabase-js';
import { signInWithKakao } from '../services/kakaoAuth';
import { signInWithGoogle } from '../services/googleAuth';
import { signInWithNaver } from '../services/naverAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Extending Provider type to include additional providers
type ExtendedProvider = Provider | 'naver';

export default function SocialLogin() {
  const [loading, setLoading] = useState<ExtendedProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSocialLogin = async (provider: ExtendedProvider) => {
    try {
      setError(null);
      setLoading(provider);
      
      let result;
      
      switch (provider) {
        case 'kakao':
          result = await signInWithKakao();
          break;
        case 'google':
          result = await signInWithGoogle();
          break;
        case 'naver':
          result = await signInWithNaver();
          break;
        default:
          result = { error: { message: 'Unsupported provider' } };
      }
      
      if (result.error) {
        setError(result.error.message || `${provider} 로그인에 실패했습니다`);
      } else {
        toast.success(`${provider} 로그인 성공!`);
        navigate('/dashboard');
      }
    } catch (err) {
      setError('예상치 못한 오류가 발생했습니다');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-gray-50 px-2 text-gray-500">또는 다음으로 계속하기</span>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-md bg-red-50 p-3">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => handleSocialLogin('kakao')}
          disabled={loading !== null}
          className="inline-flex w-full items-center justify-center rounded-md bg-yellow-400 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-yellow-300 disabled:bg-yellow-200"
        >
          <div className="flex items-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
              <path
                d="M9 1.5C4.5 1.5 0.75 4.25 0.75 7.75C0.75 10 2.25 12 4.5 13.25L3.75 16.5C3.75 16.5 7.25 14.5 7.5 14.5C8 14.5 8.5 14.5 9 14.5C13.5 14.5 17.25 11.75 17.25 8.25C17.25 4.75 13.5 1.5 9 1.5Z"
                fill="#381B1B"
              />
            </svg>
            {loading === 'kakao' ? '로딩 중...' : '카카오'}
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleSocialLogin('naver')}
          disabled={loading !== null}
          className="inline-flex w-full items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500 disabled:bg-green-400"
        >
          <div className="flex items-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
              <path
                d="M12.2 9.6L5.8 0H0V18H5.8V8.4L12.2 18H18V0H12.2V9.6Z"
                fill="white"
              />
            </svg>
            {loading === 'naver' ? '로딩 중...' : '네이버'}
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={loading !== null}
          className="inline-flex w-full items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100"
        >
          <div className="flex items-center">
            <svg width="18" height="18" viewBox="0 0 18 18" className="mr-2">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              />
            </svg>
            {loading === 'google' ? '로딩 중...' : '구글'}
          </div>
        </button>
      </div>
    </div>
  );
} 