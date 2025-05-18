import React, { useState, useEffect } from 'react';
import { User, CreditCard, FileText, Bell, Calendar, History, ChevronRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import PlanUpgradeModal from '../../components/account/PlanUpgradeModal';
import { PlanType } from '../../services/paymentService';
import { getSearchHistory, deleteAllSearchHistory, deleteSearchHistoryEntry, SearchHistoryEntry } from '../../services/searchHistoryService';
import { useGovSupport } from '../../contexts/GovSupportContext';
import { formatDate } from '../../utils/dateUtils';

export default function AccountManagement() {
  const [activeTab, setActiveTab] = useState('subscription');
  const [showPlanUpgradeModal, setShowPlanUpgradeModal] = useState(false);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string>('2024.04.15');
  const [businessPlans, setBusinessPlans] = useState<Array<{
    id: string;
    title: string;
    type: string;
    content: string;
    template?: string;
    created_at: string;
    status: string;
  }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { search } = useGovSupport();
  const { 
    currentPlan, 
    loading: subscriptionLoading,
    remainingUsage,
    refreshSubscription
  } = useSubscription();

  // Load business plans from Supabase
  useEffect(() => {
    const loadBusinessPlans = async () => {
      if (!user || !user.id) return;
      
      setIsLoading(true);
      try {
        console.log("Fetching business plans for user:", user.id);
        const { data, error } = await supabase
          .from('business_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching business plans:", error);
          toast.error('사업계획서를 불러오는 데 실패했습니다.');
          return;
        }
        
        console.log("Fetched business plans:", data);
        setBusinessPlans(data || []);
      } catch (error) {
        console.error('Error loading business plans:', error);
        toast.error('사업계획서를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBusinessPlans();
  }, [user]);

  // Load search history when tab is activated
  useEffect(() => {
    if (activeTab === 'search') {
      loadSearchHistory();
    }
  }, [activeTab]);

  // Load search history from the database
  const loadSearchHistory = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const history = await getSearchHistory(20);
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading search history:', error);
      toast.error('검색 기록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle repeating a search from history
  const handleRepeatSearch = async (entry: SearchHistoryEntry) => {
    try {
      // Parse the filters from the JSON
      const filters = typeof entry.filters === 'string' 
        ? JSON.parse(entry.filters) 
        : entry.filters;
      
      // Navigate to search page 
      navigate('/support-search');
      
      // Execute the search with a slight delay to ensure the page is loaded
      setTimeout(() => {
        search(filters);
      }, 100);
    } catch (error) {
      console.error('Error repeating search:', error);
      toast.error('검색을 실행하는 중 오류가 발생했습니다.');
    }
  };

  // Handle deleting a search history entry
  const handleDeleteEntry = async (id: string) => {
    try {
      const success = await deleteSearchHistoryEntry(id);
      if (success) {
        toast.success('검색 기록이 삭제되었습니다.');
        // Refresh the history list
        await loadSearchHistory();
      } else {
        toast.error('검색 기록 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting search history entry:', error);
      toast.error('검색 기록 삭제 중 오류가 발생했습니다.');
    }
  };

  // Handle deleting all search history
  const handleDeleteAllHistory = async () => {
    if (window.confirm('모든 검색 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        const success = await deleteAllSearchHistory();
        if (success) {
          toast.success('모든 검색 기록이 삭제되었습니다.');
          setSearchHistory([]);
        } else {
          toast.error('검색 기록 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Error deleting all search history:', error);
        toast.error('검색 기록 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // Function to open a saved business plan
  const openSavedPlan = (plan: any) => {
    try {
      console.log("Opening plan:", plan);
      
      if (!plan || !plan.id) {
        console.error("Invalid plan data:", plan);
        toast.error('유효하지 않은 사업계획서 데이터입니다.');
        return;
      }
      
      // Navigate to the business plan page with the plan ID as a query parameter
      navigate(`/dashboard/business-plan?plan_id=${plan.id}`);
      
      // Show toast notification
      toast.success('사업계획서를 불러오는 중입니다...', {
        duration: 2000,
      });
    } catch (error) {
      console.error("Error preparing to open saved plan:", error);
      toast.error('사업계획서를 열 수 없습니다.');
    }
  };

  // Get plan display name
  const getPlanDisplayName = (plan: PlanType): string => {
    switch (plan) {
      case 'free': return '무료 플랜';
      case 'pro': return '프로 플랜';
      default: return '무료 플랜';
    }
  };

  // Function to format the date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/-/g, '.');
    } catch (e) {
      return dateString;
    }
  };

  // Function to delete a business plan
  const deletePlan = async (planId: string) => {
    if (!confirm('정말로 이 사업계획서를 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('business_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', user?.id);
        
      if (error) {
        console.error("Error deleting plan:", error);
        toast.error('사업계획서 삭제에 실패했습니다.');
        return;
      }
      
      // Update local state by removing the deleted plan
      setBusinessPlans(prevPlans => prevPlans.filter(plan => plan.id !== planId));
      toast.success('사업계획서가 삭제되었습니다.');
    } catch (error) {
      console.error("Error in deletePlan:", error);
      toast.error('사업계획서 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render search history tab
  const renderSearchHistoryTab = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">검색 기록</h3>
      
      {isLoadingHistory ? (
        <div className="text-center py-8">
          <p className="text-gray-500">검색 기록을 불러오는 중...</p>
        </div>
      ) : searchHistory.length > 0 ? (
        <div className="space-y-4">
          {searchHistory.map((entry) => {
            // Parse filters if they're stored as a string
            const parsedFilters = typeof entry.filters === 'string' 
              ? JSON.parse(entry.filters) 
              : entry.filters;
            
            // Extract regions and supportAreas from filters
            const regions = parsedFilters.regions || [];
            const supportAreas = parsedFilters.supportAreas || [];
            
            // Format date
            const formattedDate = formatDate(entry.search_date);
            
            return (
              <div key={entry.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{entry.keyword}</h4>
                    <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className="text-blue-600 text-sm hover:text-blue-800"
                      onClick={() => handleRepeatSearch(entry)}
                      title="이 검색 다시 실행"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button 
                      className="text-red-600 text-sm hover:text-red-800"
                      onClick={() => handleDeleteEntry(entry.id)}
                      title="이 검색 기록 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {regions.map((region: string, idx: number) => (
                    <span key={`region-${idx}`} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
                      {region}
                    </span>
                  ))}
                  {supportAreas.map((area: string, idx: number) => (
                    <span key={`area-${idx}`} className="px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">검색 기록이 없습니다.</p>
        </div>
      )}
      
      {searchHistory.length > 0 && (
        <div className="mt-4 text-right">
          <button 
            className="text-gray-500 text-sm hover:text-gray-700 flex items-center ml-auto"
            onClick={handleDeleteAllHistory}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            검색 기록 전체 삭제
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center space-x-3 mb-8">
        <User className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold">계정 관리</h2>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-t-xl shadow-sm">
        <div className="flex overflow-x-auto">
          <button 
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'subscription' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('subscription')}
          >
            구독 상태
          </button>
          <button 
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'payment' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('payment')}
          >
            결제 내역
          </button>
          <button 
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'plans' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('plans')}
          >
            사업계획서 목록
          </button>
          <button 
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'notifications' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('notifications')}
          >
            알림 설정
          </button>
          <button 
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'search' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('search')}
          >
            검색 기록
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl shadow-sm p-4 md:p-6 mb-6">
        {/* Subscription Status Tab */}
        {activeTab === 'subscription' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">현재 구독 상태</h3>
              {subscriptionLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{getPlanDisplayName(currentPlan)}</h4>
                      <p className="text-sm text-gray-600">{subscriptionStartDate} 부터 사용 중</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                      활성화
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {currentPlan === 'free' && (
                      <>
                        <p>• 맞춤 정부지원사업 검색 추천</p>
                        <p>• 알림서비스 무료 사용 기간: 2025.04.15 까지</p>
                        <p>• 사업계획서 초안 생성(1회/일)</p>
                      </>
                    )}
                    {currentPlan === 'pro' && (
                      <>
                        <p>• 무료 플랜의 모든 기능 포함</p>
                        <p>• 맞춤형 사업계획서 템플릿 제공</p>
                      </>
                    )}
                  </div>
                  <button 
                    className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => setShowPlanUpgradeModal(true)}
                  >
                    플랜 업그레이드
                  </button>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">개별 서비스 이용 현황</h3>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bell className="w-6 h-6 text-blue-600 mr-3" />
                      <div>
                        <h4 className="font-medium">알림 서비스</h4>
                        {currentPlan === 'free' ? (
                          <p className="text-sm text-gray-600">1년 무료 이용 중 (2025.04.15 만료)</p>
                        ) : (
                          <p className="text-sm text-gray-600">무제한 이용 가능</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="w-6 h-6 text-blue-600 mr-3" />
                      <div>
                        <h4 className="font-medium">AI 사업계획서</h4>
                        {currentPlan === 'free' ? (
                          <p className="text-sm text-gray-600">무료 생성 {remainingUsage.aiBusinessPlans}회 남음</p>
                        ) : (
                          <p className="text-sm text-gray-600">무제한 생성 가능</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="w-6 h-6 text-blue-600 mr-3" />
                      <div>
                        <h4 className="font-medium">템플릿 이용</h4>
                        {currentPlan === 'free' && (
                          <p className="text-sm text-gray-600">기본 템플릿 이용 가능</p>
                        )}
                        {currentPlan === 'pro' && (
                          <p className="text-sm text-gray-600">맞춤형 사업계획서 템플릿 제공</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Payment History Tab */}
        {activeTab === 'payment' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">결제 내역</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      날짜
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      내용
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      금액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      2024.04.15
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      무료 플랜 가입
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      0원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                        완료
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      2024.04.15
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      알림 서비스 1년 무료 이용
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      0원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                        완료
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Empty State */}
            {false && (
              <div className="text-center py-8">
                <p className="text-gray-500">아직 결제 내역이 없습니다.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Business Plans Tab */}
        {activeTab === 'plans' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">사업계획서 목록</h3>
              <div className="relative">
                <input
                  type="text"
                  className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="사업계획서 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : businessPlans.length > 0 ? (
                businessPlans
                  .filter(plan => plan.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((plan, index) => (
                    <div key={plan.id} className="p-4 border rounded-lg hover:border-blue-300 cursor-pointer">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium">{plan.title}</h4>
                          <p className="text-sm text-gray-600">{plan.type}</p>
                          {plan.template && (
                            <p className="text-sm text-gray-600">템플릿: {plan.template}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">작성일: {formatDate(plan.created_at)}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`px-3 py-1 mb-2 ${plan.status === '초안' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'} rounded-full text-sm`}>
                            {plan.status}
                          </span>
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-600 text-sm hover:text-blue-800"
                              onClick={() => openSavedPlan(plan)}
                            >
                              열기
                            </button>
                            <button 
                              className="text-red-600 text-sm hover:text-red-800"
                              onClick={() => deletePlan(plan.id)}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">작성한 사업계획서가 없습니다.</p>
                  <button 
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => navigate('/dashboard/business-plan')}
                  >
                    새 사업계획서 작성
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Notification Settings Tab */}
        {activeTab === 'notifications' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">알림 설정</h3>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">카카오톡 알림</h4>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">연결됨</span>
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  </div>
                </div>
                <button className="text-blue-600 text-sm hover:text-blue-800">
                  알림 설정 관리하기
                </button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">알림 수신 설정</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">새로운 지원사업 알림</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        defaultChecked 
                        onChange={() => {}} 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">마감 임박 알림</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        defaultChecked 
                        onChange={() => {}} 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">플랜 만료 알림</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        defaultChecked 
                        onChange={() => {}} 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Search History Tab */}
        {activeTab === 'search' && renderSearchHistoryTab()}
      </div>
      
      {/* Plan Upgrade Modal */}
      <PlanUpgradeModal
        isOpen={showPlanUpgradeModal}
        onClose={() => setShowPlanUpgradeModal(false)}
        currentPlan={currentPlan}
      />
    </div>
  );
}