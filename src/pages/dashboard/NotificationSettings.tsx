import React, { useState, useEffect } from 'react';
import { Bell, MapPin, Briefcase, Calendar, AlertCircle, Check, Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  getUserNotificationSettings, 
  saveNotificationSettings, 
  linkKakaoForNotifications,
  unlinkKakaoForNotifications,
  handleKakaoLinkingCallback,
  NotificationSettings as NotificationSettingsType
} from '../../services/userNotificationService';
import { toast } from 'react-hot-toast';

export default function NotificationSettings() {
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [notificationFrequency, setNotificationFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [deadlineNotification, setDeadlineNotification] = useState(true);
  const [deadlineDays, setDeadlineDays] = useState(3);
  const [newProgramsAlert, setNewProgramsAlert] = useState(true);
  const [kakaoLinked, setKakaoLinked] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['서울']);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(['자금']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const regions = ['서울', '부산', '인천', '대구', '광주', '대전', '울산', '경기'];
  const industries = [
    { id: '01', name: '자금' },     // Finance
    { id: '02', name: '기술' },     // Technology
    { id: '03', name: '인력' },     // Manpower
    { id: '04', name: '수출' },     // Export
    { id: '05', name: '내수' },     // Domestic
    { id: '06', name: '창업' },     // Startup
    { id: '07', name: '경영' },     // Management
    { id: '09', name: '기타' },     // Etc
  ];
  
  // Handle Kakao linking callback
  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const action = searchParams.get('action');
      
      if (action === 'link-kakao') {
        try {
          setLoading(true);
          const result = await handleKakaoLinkingCallback();
          
          if (result.success) {
            toast.success('카카오톡 알림이 성공적으로 연결되었습니다.');
            setKakaoLinked(true);
            
            // Remove the action param from URL
            navigate('/dashboard/notifications', { replace: true });
          } else {
            toast.error(`카카오톡 연결 실패: ${result.error}`);
          }
        } catch (error) {
          console.error('Error handling Kakao callback:', error);
          toast.error('카카오톡 연결 중 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    handleCallback();
  }, [location, navigate]);
  
  // Load user notification settings on component mount
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const settings = await getUserNotificationSettings();
        
        if (settings) {
          setNotificationFrequency(settings.notificationFrequency);
          setNotificationTime(settings.notificationTime || '09:00');
          setDeadlineNotification(settings.deadlineNotification);
          setDeadlineDays(settings.deadlineDays || 3);
          setNewProgramsAlert(settings.newProgramsAlert);
          setKakaoLinked(settings.kakaoLinked);
          setSelectedRegions(settings.regions || ['서울']);
          setSelectedIndustries(settings.categories || ['자금']);
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
        toast.error('알림 설정을 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    
    loadSettings();
  }, []);
  
  // Save notification settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const settings: NotificationSettingsType = {
        userId: '', // Will be set in the backend
        notificationFrequency,
        notificationTime,
        deadlineNotification,
        deadlineDays,
        newProgramsAlert,
        kakaoLinked,
        regions: selectedRegions,
        categories: selectedIndustries
      };
      
      const result = await saveNotificationSettings(settings);
      
      if (result.success) {
        toast.success('알림 설정이 저장되었습니다.');
      } else {
        toast.error(`저장 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      toast.error('알림 설정을 저장하는 데 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };
  
  // Link KakaoTalk for notifications
  const handleLinkKakao = async () => {
    try {
      setSaving(true);
      const result = await linkKakaoForNotifications();
      
      if (result.success) {
        if (result.redirecting) {
          // The user will be redirected to Kakao, so we don't need to do anything
          toast.success('카카오톡 로그인 페이지로 이동합니다...');
        } else {
          setKakaoLinked(true);
          toast.success('카카오톡 알림이 연결되었습니다.');
        }
      } else {
        toast.error(`연결 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to link KakaoTalk:', error);
      toast.error('카카오톡 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };
  
  // Unlink KakaoTalk
  const handleUnlinkKakao = async () => {
    try {
      setSaving(true);
      const result = await unlinkKakaoForNotifications();
      
      if (result.success) {
        setKakaoLinked(false);
        toast.success('카카오톡 알림 연결이 해제되었습니다.');
      } else {
        toast.error(`연결 해제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to unlink KakaoTalk:', error);
      toast.error('카카오톡 연결 해제에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };
  
  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter(r => r !== region));
    } else {
      setSelectedRegions([...selectedRegions, region]);
    }
  };
  
  const toggleIndustry = (industry: string) => {
    if (selectedIndustries.includes(industry)) {
      setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
    } else {
      setSelectedIndustries([...selectedIndustries, industry]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Bell className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold">알림 설정</h2>
        </div>
        
        <button
          className={`px-4 py-2 rounded-lg ${saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          onClick={handleSaveSettings}
          disabled={saving || loading}
        >
          {saving ? (
            <span className="flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </span>
          ) : '설정 저장'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">알림 설정을 불러오는 중...</span>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">카카오톡 알림</h3>
              <button 
                className="mt-2 md:mt-0 text-sm text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
                onClick={() => setIsSubscriptionModalOpen(true)}
              >
                알림 구독 관리
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3 mb-2 md:mb-0">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600" 
                    checked={newProgramsAlert}
                    onChange={() => setNewProgramsAlert(!newProgramsAlert)}
                  />
                  <span>새로운 지원사업 알림</span>
                </div>
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 items-start md:items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap">알림 빈도:</span>
                    <select 
                      className="border rounded-lg py-1 px-2 text-sm"
                      value={notificationFrequency}
                      onChange={(e) => setNotificationFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                      disabled={!newProgramsAlert}
                    >
                      <option value="daily">매일 (오늘의 신규 공고)</option>
                      <option value="weekly">매주 월요일 (주간 요약)</option>
                      <option value="monthly">매월 1일 (월간 요약)</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap">알림 시간:</span>
                    <input 
                      type="time" 
                      className="border rounded-lg py-1 px-2 text-sm"
                      value={notificationTime}
                      onChange={(e) => setNotificationTime(e.target.value)}
                      disabled={!newProgramsAlert}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3 mb-2 md:mb-0">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600"
                    checked={deadlineNotification}
                    onChange={() => setDeadlineNotification(!deadlineNotification)}
                  />
                  <span>마감 임박 알림</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">지원사업 마감</span>
                  <select 
                    className="border rounded-lg py-1 px-2 text-sm"
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(parseInt(e.target.value))}
                    disabled={!deadlineNotification}
                  >
                    <option value="1">1일</option>
                    <option value="3">3일</option>
                    <option value="5">5일</option>
                    <option value="7">7일</option>
                  </select>
                  <span className="text-sm text-gray-500">전에 알림 받기</span>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>가격 정책:</strong> 첫 1년간 무료로 알림을 받아보세요. 이후에는 월 1,000원의 구독료가 발생합니다.
                    </p>
                    <p className="text-xs text-gray-500">
                      구독 1년 후에는 카카오톡으로 자동 결제 메시지가 발송됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">관심 지역</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              {selectedRegions.map(region => (
                <div key={region} className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>{region}</span>
                  <button 
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => toggleRegion(region)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button 
                className="px-4 py-2 border border-dashed border-gray-300 rounded-full text-gray-500 hover:border-blue-500 hover:text-blue-500"
                onClick={() => document.getElementById('regionSelector')?.classList.toggle('hidden')}
              >
                + 지역 추가
              </button>
            </div>
            
            <div id="regionSelector" className="hidden p-4 border rounded-lg mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {regions.map(region => (
                  <button
                    key={region}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      selectedRegions.includes(region)
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => toggleRegion(region)}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4">관심 지원분야</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              {selectedIndustries.map(industry => (
                <div key={industry} className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>{industry}</span>
                  <button 
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => toggleIndustry(industry)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button 
                className="px-4 py-2 border border-dashed border-gray-300 rounded-full text-gray-500 hover:border-blue-500 hover:text-blue-500"
                onClick={() => document.getElementById('industrySelector')?.classList.toggle('hidden')}
              >
                + 지원분야 추가
              </button>
            </div>
            
            <div id="industrySelector" className="hidden p-4 border rounded-lg">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {industries.map(industry => (
                  <button
                    key={industry.id}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      selectedIndustries.includes(industry.name)
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => toggleIndustry(industry.name)}
                  >
                    {industry.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Subscription Modal */}
      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">알림 구독 관리</h3>
            <div className="space-y-4 mb-6">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">무료 구독</h4>
                    <p className="text-sm text-gray-600">첫 1년간 무료</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="w-5 h-5 mr-1" />
                    <span>활성화됨</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  구독 시작일: 2024.04.01
                  <br />
                  무료 기간 만료일: 2025.04.01
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">유료 구독</h4>
                    <p className="text-sm text-gray-600">월 1,000원</p>
                  </div>
                  <span className="text-gray-400 text-sm">비활성화됨</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  무료 기간 이후 자동으로 결제 메시지가 발송됩니다.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">카카오톡 연결</h4>
                    <p className="text-sm text-gray-600">알림을 받기 위해 카카오톡을 연결하세요</p>
                  </div>
                  {kakaoLinked ? (
                    <div className="flex items-center text-green-600">
                      <Check className="w-5 h-5 mr-1" />
                      <span>연결됨</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">연결 안됨</span>
                  )}
                </div>
                <div className="mt-3">
                  {kakaoLinked ? (
                    <button 
                      className="text-sm px-3 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50"
                      onClick={handleUnlinkKakao}
                      disabled={saving}
                    >
                      {saving ? '처리 중...' : '연결 해제'}
                    </button>
                  ) : (
                    <button 
                      className="text-sm px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      onClick={handleLinkKakao}
                      disabled={saving}
                    >
                      {saving ? '처리 중...' : '카카오톡 연결하기'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                onClick={() => setIsSubscriptionModalOpen(false)}
              >
                닫기
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                구독 연장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}