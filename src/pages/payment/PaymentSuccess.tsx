import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import { verifyTossPayment } from '../../services/paymentService';
import { toast } from 'react-hot-toast';

export default function PaymentSuccess() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Parse URL query parameters
        const params = new URLSearchParams(location.search);
        const paymentKey = params.get('paymentKey');
        const orderId = params.get('orderId');
        const amount = params.get('amount');
        
        if (!paymentKey || !orderId || !amount) {
          toast.error('결제 정보가 올바르지 않습니다.');
          setIsSuccess(false);
          setIsVerifying(false);
          return;
        }
        
        // Verify payment with our backend
        const result = await verifyTossPayment(
          paymentKey,
          orderId,
          parseInt(amount)
        );
        
        if (result.success) {
          setIsSuccess(true);
          toast.success('결제가 완료되었습니다.');
        } else {
          setIsSuccess(false);
          toast.error(result.error || '결제 확인 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setIsSuccess(false);
        toast.error('결제 확인 중 오류가 발생했습니다.');
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyPayment();
  }, [location.search]);
  
  const goToDashboard = () => {
    navigate('/dashboard/billing');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {isVerifying ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">결제 확인 중...</h2>
            <p className="mt-2 text-sm text-gray-600">잠시만 기다려 주세요.</p>
          </div>
        ) : isSuccess ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">결제가 완료되었습니다</h2>
            <p className="mt-2 text-sm text-gray-600">
              결제가 성공적으로 완료되었습니다. 이제 서비스를 이용하실 수 있습니다.
            </p>
            <div className="mt-6">
              <button
                onClick={goToDashboard}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                대시보드로 이동
              </button>
            </div>
          </div>
        ) : (
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
                onClick={goToDashboard}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                결제 페이지로 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 