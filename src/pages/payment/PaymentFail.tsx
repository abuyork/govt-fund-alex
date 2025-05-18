import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function PaymentFail() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract error information from URL
    const params = new URLSearchParams(location.search);
    const errorCode = params.get('code');
    const errorMessage = params.get('message');
    
    // Show error message
    toast.error(errorMessage || '결제가 취소되었거나 실패했습니다.');
  }, [location.search]);
  
  const goToBilling = () => {
    navigate('/dashboard/billing');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">결제 실패</h2>
          <p className="mt-2 text-sm text-gray-600">
            결제 과정에서 문제가 발생했습니다. 다시 시도해 주세요.
          </p>
          <div className="mt-6">
            <button
              onClick={goToBilling}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              결제 페이지로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 