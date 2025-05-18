import React, { useState, useContext, useEffect } from 'react';
import { CreditCard, Check, ChevronDown, ChevronUp, Shield, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { processPayment, PaymentMethod, PlanType } from '../../services/paymentService';
import { toast } from 'react-hot-toast';

export default function Billing() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('toss');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardHolder: ''
  });
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for plan selection in URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const planParam = queryParams.get('plan') as PlanType | null;
    
    if (planParam && ['free', 'pro'].includes(planParam)) {
      setSelectedPlan(planParam);
      // Automatically expand the details for the selected plan
      setShowPlanDetails({
        ...showPlanDetails,
        [planParam]: true
      });
    }
  }, [location.search]);
  
  const [showPlanDetails, setShowPlanDetails] = useState<Record<string, boolean>>({
    free: false,
    pro: true,
  });
  
  const togglePlanDetails = (plan: string) => {
    setShowPlanDetails({
      ...showPlanDetails,
      [plan]: !showPlanDetails[plan]
    });
  };

  // Handle card details change
  const handleCardDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Get the amount based on selected plan
  const getAmount = () => {
    switch (selectedPlan) {
      case 'free':
        return 0;
      case 'pro':
        return 10890; // 9900 + 990 (부가세)
      default:
        return 0;
    }
  };
  
  // Process payment
  const handlePayment = async () => {
    if (selectedPlan === 'free') {
      toast.success('무료 플랜이 활성화되었습니다.');
      return;
    }
    
    if (!user?.id) {
      toast.error('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const amount = getAmount();
      
      // For card payment, validate card details
      if (selectedPayment === 'card') {
        if (!cardDetails.cardNumber || !cardDetails.cardExpiry || !cardDetails.cardCvc || !cardDetails.cardHolder) {
          toast.error('카드 정보를 모두 입력해주세요.');
          setIsProcessing(false);
          return;
        }
      }
      
      const paymentResult = await processPayment({
        userId: user.id,
        planType: selectedPlan,
        paymentMethod: selectedPayment,
        amount,
        paymentDetails: selectedPayment === 'card' ? cardDetails : undefined
      });
      
      if (paymentResult.success) {
        if (selectedPayment === 'toss' && paymentResult.tossPaymentURL) {
          // Redirect to Toss payment page
          window.location.href = paymentResult.tossPaymentURL;
        } else if (selectedPayment === 'bank') {
          toast.success('입금 확인 후 서비스가 활성화됩니다.');
          navigate('/dashboard');
        } else {
          toast.success('결제가 완료되었습니다.');
          navigate('/dashboard');
        }
      } else {
        toast.error(paymentResult.error || '결제 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-3 mb-8">
        <CreditCard className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold">결제</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">플랜 선택</h3>
            
            {/* Free Plan */}
            <div className={`border rounded-lg mb-4 overflow-hidden ${selectedPlan === 'free' ? 'border-blue-500' : ''}`}>
              <div 
                className={`p-4 flex justify-between items-center cursor-pointer ${selectedPlan === 'free' ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedPlan('free')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border ${selectedPlan === 'free' ? 'bg-blue-600 border-blue-600' : 'border-gray-300'} mr-3 flex items-center justify-center`}>
                    {selectedPlan === 'free' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <h4 className="font-medium">무료 플랜</h4>
                    <p className="text-sm text-gray-600">0원</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlanDetails('free');
                  }}
                  className="text-gray-500"
                >
                  {showPlanDetails.free ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
              
              {showPlanDetails.free && (
                <div className="p-4 bg-gray-50 border-t">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      맞춤 정부지원사업 검색 추천
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      알림서비스 1년 무료
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      사업계획서 초안 생성(1회/일)
                    </li>
                  </ul>
                </div>
              )}
            </div>
            
            {/* Pro Plan */}
            <div className={`border rounded-lg mb-4 overflow-hidden ${selectedPlan === 'pro' ? 'border-blue-500' : ''}`}>
              <div 
                className={`p-4 flex justify-between items-center cursor-pointer ${selectedPlan === 'pro' ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedPlan('pro')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border ${selectedPlan === 'pro' ? 'bg-blue-600 border-blue-600' : 'border-gray-300'} mr-3 flex items-center justify-center`}>
                    {selectedPlan === 'pro' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <h4 className="font-medium">프로 플랜</h4>
                    <p className="text-sm text-gray-600">9,900원/월</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlanDetails('pro');
                  }}
                  className="text-gray-500"
                >
                  {showPlanDetails.pro ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
              
              {showPlanDetails.pro && (
                <div className="p-4 bg-gray-50 border-t">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      무료 플랜의 모든 기능 포함
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      맞춤형 사업계획서 템플릿 제공
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4">결제 수단 선택</h3>
            
            {/* Credit Card Option */}
            <div 
              className={`p-4 border rounded-lg mb-4 cursor-pointer ${selectedPayment === 'card' ? 'border-blue-500 bg-blue-50' : ''}`}
              onClick={() => setSelectedPayment('card')}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border ${selectedPayment === 'card' ? 'bg-blue-600 border-blue-600' : 'border-gray-300'} mr-3 flex items-center justify-center`}>
                  {selectedPayment === 'card' && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <h4 className="font-medium">신용카드</h4>
                </div>
              </div>
            </div>
            
            {/* Bank Transfer Option */}
            <div 
              className={`p-4 border rounded-lg mb-4 cursor-pointer ${selectedPayment === 'bank' ? 'border-blue-500 bg-blue-50' : ''}`}
              onClick={() => setSelectedPayment('bank')}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border ${selectedPayment === 'bank' ? 'bg-blue-600 border-blue-600' : 'border-gray-300'} mr-3 flex items-center justify-center`}>
                  {selectedPayment === 'bank' && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <h4 className="font-medium">계좌이체</h4>
                </div>
              </div>
            </div>
            
            {/* Toss Payment Option */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer ${selectedPayment === 'toss' ? 'border-blue-500 bg-blue-50' : ''}`}
              onClick={() => setSelectedPayment('toss')}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border ${selectedPayment === 'toss' ? 'bg-blue-600 border-blue-600' : 'border-gray-300'} mr-3 flex items-center justify-center`}>
                  {selectedPayment === 'toss' && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <h4 className="font-medium">토스페이먼츠</h4>
                </div>
              </div>
            </div>
            
            {/* Payment Form */}
            {selectedPayment === 'card' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카드 번호
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleCardDetailChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0000 0000 0000 0000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      만료일
                    </label>
                    <input
                      type="text"
                      name="cardExpiry"
                      value={cardDetails.cardExpiry}
                      onChange={handleCardDetailChange}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      name="cardCvc"
                      value={cardDetails.cardCvc}
                      onChange={handleCardDetailChange}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카드 소유자 이름
                  </label>
                  <input
                    type="text"
                    name="cardHolder"
                    value={cardDetails.cardHolder}
                    onChange={handleCardDetailChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="홍길동"
                  />
                </div>
              </div>
            )}
            
            {selectedPayment === 'bank' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  아래 계좌로 입금해 주세요:
                </p>
                <p className="text-sm font-medium">정부지원 AI</p>
                <p className="text-sm">하나은행 123-456789-01234</p>
                <p className="text-sm text-gray-500 mt-2">
                  * 입금 후 영업일 기준 1-2일 내에 확인됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 sticky top-20">
            <h3 className="text-lg font-semibold mb-4">주문 요약</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">플랜</span>
                <span className="font-medium">
                  {selectedPlan === 'free' ? '무료 플랜' : '프로 플랜'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">기간</span>
                <span className="font-medium">1개월</span>
              </div>
              <div className="border-t border-gray-200 my-4"></div>
              <div className="flex justify-between">
                <span className="text-gray-600">소계</span>
                <span className="font-medium">
                  {selectedPlan === 'free' ? '0원' : '9,900원'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">부가세</span>
                <span className="font-medium">
                  {selectedPlan === 'free' ? '0원' : '990원'}
                </span>
              </div>
              <div className="border-t border-gray-200 my-4"></div>
              <div className="flex justify-between font-bold">
                <span>총 결제금액</span>
                <span>
                  {selectedPlan === 'free' ? '0원' : '10,890원'}
                </span>
              </div>
            </div>
            
            <button 
              onClick={handlePayment}
              disabled={isProcessing || (selectedPlan === 'free' ? false : !selectedPayment)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  처리 중...
                </>
              ) : (
                '결제하기'
              )}
            </button>
            
            <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
              <Shield className="w-4 h-4 mr-1" />
              보안 결제
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}