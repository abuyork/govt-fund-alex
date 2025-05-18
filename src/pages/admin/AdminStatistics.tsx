import React, { useState, useEffect } from 'react';
import { Users, CreditCard, LayoutTemplate, FileText } from 'lucide-react';
import { 
  fetchStatistics, 
  fetchActivitySummary, 
  fetchPopularTemplates,
  ensureTablesExist,
  StatsType,
  ActivitySummary,
  PopularTemplate
} from '../../services/statisticsService';

export default function AdminStatistics() {
  const [stats, setStats] = useState<StatsType>({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalTemplates: 0,
    totalDocuments: 0
  });
  
  const [activityData, setActivityData] = useState<ActivitySummary>({
    newSignups: 0,
    paymentCount: 0,
    generatedDocuments: 0
  });
  
  const [popularTemplates, setPopularTemplates] = useState<PopularTemplate[]>([]);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check database connectivity but don't block on schema issues
      const tablesExist = await ensureTablesExist();
      
      // Fetch all data in parallel - each function now has its own error handling
      const [statsData, activityData, templatesData] = await Promise.all([
        fetchStatistics(timeframe),
        fetchActivitySummary(timeframe),
        fetchPopularTemplates()
      ]);
      
      setStats(statsData);
      setActivityData(activityData);
      setPopularTemplates(templatesData);
      
      // Show a warning if there were schema issues, but we still have some data
      if (!tablesExist) {
        setError('일부 데이터베이스 테이블에 접근할 수 없습니다. 가능한 데이터만 표시합니다.');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  // Format large numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };
  
  // Format time in minutes and seconds
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}분 ${remainingSeconds}초`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">통계 대시보드</h1>
        
        <div className="flex">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                timeframe === 'week' ? 'bg-white rounded-md shadow' : 'text-gray-500'
              }`}
              onClick={() => setTimeframe('week')}
            >
              주간
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                timeframe === 'month' ? 'bg-white rounded-md shadow' : 'text-gray-500'
              }`}
              onClick={() => setTimeframe('month')}
            >
              월간
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                timeframe === 'year' ? 'bg-white rounded-md shadow' : 'text-gray-500'
              }`}
              onClick={() => setTimeframe('year')}
            >
              연간
            </button>
          </div>
          
          <button 
            className="ml-2 px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 text-blue-700"
            onClick={() => fetchData()}
          >
            새로고침
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20">데이터를 불러오는 중...</div>
      ) : (
        <>
          {error && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
              <p className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                {error}
              </p>
            </div>
          )}
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {/* User Stats Card */}
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="ml-4 text-lg font-semibold text-gray-800">사용자</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">총 사용자</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">활성 사용자</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.activeUsers)}</p>
                  <p className="text-xs text-gray-500">
                    ({stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Revenue Stats Card */}
            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CreditCard className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="ml-4 text-lg font-semibold text-gray-800">매출</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">총 매출</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {timeframe === 'week' ? '주간' : timeframe === 'month' ? '월간' : '연간'} 매출
                  </p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
                </div>
              </div>
            </div>

            {/* Content Stats Card */}
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <LayoutTemplate className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="ml-4 text-lg font-semibold text-gray-800">콘텐츠</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">총 템플릿</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.totalTemplates)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">생성된 문서</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.totalDocuments)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Overview */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">활동 요약</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">신규 가입</p>
                    <p className="text-xl font-bold">{formatNumber(activityData.newSignups)}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">결제 건수</p>
                    <p className="text-xl font-bold">{formatNumber(activityData.paymentCount)}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">생성된 문서</p>
                    <p className="text-xl font-bold">{formatNumber(activityData.generatedDocuments)}</p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </div>
            </div>
          </div>

          {/* Popular Templates */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">인기 템플릿</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">템플릿</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용 횟수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 생성 시간</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {popularTemplates.length > 0 ? (
                    popularTemplates.map((template) => (
                      <tr key={template.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatNumber(template.usage_count)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(template.avg_generation_time)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                        템플릿 사용 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 