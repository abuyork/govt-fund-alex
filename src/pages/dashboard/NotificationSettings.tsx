import { AlertCircle, Bell, Briefcase, Calendar, Check, Clock, Loader2, MapPin, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { MultiSelectDropdown } from '../../components/ui/MultiSelectDropdown';
import {
  getUserNotificationSettings,
  handleKakaoLinkingCallback,
  linkKakaoForNotifications,
  NotificationSettings as NotificationSettingsType,
  saveNotificationSettings,
  unlinkKakaoForNotifications
} from '../../services/userNotificationService';

// Custom frequency option component
interface FrequencyOptionProps {
  value: 'daily' | 'weekly' | 'monthly';
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const FrequencyOption: React.FC<FrequencyOptionProps> = ({
  value,
  title,
  description,
  icon,
  selected,
  onSelect,
  disabled = false
}) => {
  return (
    <div
      className={`relative border rounded-lg p-4 cursor-pointer transition-all ${selected
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onSelect}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <div className={`p-2 rounded-full ${selected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
            {icon}
          </div>
        </div>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        {selected && (
          <div className="absolute top-3 right-3">
            <div className="bg-blue-500 rounded-full p-1">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function NotificationSettings() {
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [notificationFrequency, setNotificationFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [deadlineNotification, setDeadlineNotification] = useState(true);
  const [deadlineDays, setDeadlineDays] = useState(3);
  const [newProgramsAlert, setNewProgramsAlert] = useState(true);
  const [kakaoLinked, setKakaoLinked] = useState(false);
  const [kakaoTokenExpiresAt, setKakaoTokenExpiresAt] = useState<Date | null>(null);
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

  // Convert arrays to MultiSelectDropdown options format
  const regionOptions = regions.map(region => ({ value: region, label: region }));
  const industryOptions = industries.map(industry => ({ value: industry.name, label: industry.name }));

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
          // Set expiration time if available
          if (settings.kakaoTokenExpiresAt) {
            setKakaoTokenExpiresAt(new Date(settings.kakaoTokenExpiresAt));
          }
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

  // Get the remaining time for Kakao token
  const getKakaoTokenStatus = () => {
    if (!kakaoTokenExpiresAt) return { isExpired: true, daysLeft: 0, formattedTime: '만료됨' };

    const now = new Date();
    const diffTime = kakaoTokenExpiresAt.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const isExpired = diffTime <= 0;

    let formattedTime = `${diffDays}일 남음`;
    if (isExpired) {
      formattedTime = '만료됨';
    } else if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours > 0) {
        formattedTime = `${diffHours}시간 남음`;
      } else {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        formattedTime = `${diffMinutes}분 남음`;
      }
    }

    return { isExpired, daysLeft: diffDays, formattedTime };
  };

  const tokenStatus = getKakaoTokenStatus();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Bell className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold">알림 설정</h2>
        </div>

        <div className="flex space-x-3">
          <button
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            onClick={() => setIsSubscriptionModalOpen(true)}
          >
            알림 구독 관리
          </button>
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
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">알림 설정을 불러오는 중...</span>
        </div>
      ) : (
        <>
          {/* KakaoTalk Connection Status Card */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">카카오톡 연결 상태</h3>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border p-4 rounded-lg">
              <div className="flex items-center mb-4 md:mb-0">
                {kakaoLinked ? (
                  <div className="flex items-center">
                    <div className="bg-green-100 p-3 rounded-full mr-4">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">카카오톡 알림 연결됨</h4>
                      {tokenStatus.isExpired ? (
                        <p className="text-sm text-red-500">
                          토큰이 만료되었습니다. 재연결이 필요합니다.
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          토큰 만료까지: <span className="font-medium">{tokenStatus.formattedTime}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-3 rounded-full mr-4">
                      <XCircle className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">카카오톡 알림 연결 필요</h4>
                      <p className="text-sm text-gray-500">
                        알림을 받으려면 카카오톡 계정을 연결하세요.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                {kakaoLinked ? (
                  <div className="flex space-x-3">
                    {tokenStatus.isExpired || tokenStatus.daysLeft < 7 ? (
                      <button
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center"
                        onClick={handleLinkKakao}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        {saving ? '처리 중...' : '토큰 갱신하기'}
                      </button>
                    ) : null}
                    <button
                      className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
                      onClick={handleUnlinkKakao}
                      disabled={saving}
                    >
                      {saving ? '처리 중...' : '연결 해제'}
                    </button>
                  </div>
                ) : (
                  <button
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center"
                    onClick={handleLinkKakao}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {saving ? '처리 중...' : '카카오톡 연결하기'}
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <p>카카오톡 알림을 받으려면 계정을 연결해야 합니다. 토큰은 일정 기간 후 만료되며, 만료 전에 갱신하는 것이 좋습니다.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">알림 빈도 설정</h3>
            </div>

            {/* New Programs Alert Section */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600"
                  checked={newProgramsAlert}
                  onChange={() => setNewProgramsAlert(!newProgramsAlert)}
                  id="newProgramsAlert"
                />
                <label htmlFor="newProgramsAlert" className="font-medium">새로운 지원사업 알림</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <FrequencyOption
                  value="daily"
                  title="매일 알림"
                  description="매일 새롭게 등록된 지원사업 정보를 받아보세요."
                  icon={<Calendar className="w-5 h-5" />}
                  selected={notificationFrequency === 'daily'}
                  onSelect={() => setNotificationFrequency('daily')}
                  disabled={!newProgramsAlert}
                />
                <FrequencyOption
                  value="weekly"
                  title="주간 요약"
                  description="매주 월요일에 지난 주 등록된 지원사업 요약을 받아보세요."
                  icon={<Calendar className="w-5 h-5" />}
                  selected={notificationFrequency === 'weekly'}
                  onSelect={() => setNotificationFrequency('weekly')}
                  disabled={!newProgramsAlert}
                />
                <FrequencyOption
                  value="monthly"
                  title="월간 요약"
                  description="매월 1일에 지난 달 등록된 지원사업 요약을 받아보세요."
                  icon={<Calendar className="w-5 h-5" />}
                  selected={notificationFrequency === 'monthly'}
                  onSelect={() => setNotificationFrequency('monthly')}
                  disabled={!newProgramsAlert}
                />
              </div>

              <div className="flex items-center mt-4 mb-2">
                <Clock className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium">알림 시간 설정</span>
              </div>
              <div className="flex items-center">
                <input
                  type="time"
                  className="border rounded-lg py-2 px-3"
                  value={notificationTime}
                  onChange={(e) => setNotificationTime(e.target.value)}
                  disabled={!newProgramsAlert}
                />
                <p className="ml-3 text-sm text-gray-500">
                  알림을 받을 시간을 선택하세요. 선택한 시간에 알림이 발송됩니다.
                </p>
              </div>
            </div>

            <hr className="my-6" />

            {/* Deadline Notification Section */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600"
                  checked={deadlineNotification}
                  onChange={() => setDeadlineNotification(!deadlineNotification)}
                  id="deadlineNotification"
                />
                <label htmlFor="deadlineNotification" className="font-medium">마감 임박 알림</label>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
                <div className="flex items-center">
                  <span className="mr-2">지원사업 마감</span>
                  <select
                    className="border rounded-lg py-2 px-3"
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(parseInt(e.target.value))}
                    disabled={!deadlineNotification}
                  >
                    <option value="1">1일</option>
                    <option value="3">3일</option>
                    <option value="5">5일</option>
                    <option value="7">7일</option>
                  </select>
                  <span className="ml-2">전에 알림 받기</span>
                </div>
                <p className="text-sm text-gray-500 ml-0 md:ml-4">
                  관심 있는 지원사업의 마감일이 다가오면 알림을 받을 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">관심 지역</h3>
            <div className="mb-2">
              <MultiSelectDropdown
                options={regionOptions}
                selectedValues={selectedRegions}
                onChange={setSelectedRegions}
                placeholder="지역을 선택하세요"
                searchPlaceholder="지역 검색..."
                icon={<MapPin className="w-4 h-4 text-blue-600" />}
                className="w-full"
              />
              <p className="mt-2 text-xs text-gray-500">
                지역을 선택하지 않으면 전국 지원사업 알림을 받게 됩니다. 특정 지역을 선택하면 해당 지역 및 전국 지원사업 알림을 받습니다.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4">관심 지원분야</h3>
            <div className="mb-2">
              <MultiSelectDropdown
                options={industryOptions}
                selectedValues={selectedIndustries}
                onChange={setSelectedIndustries}
                placeholder="지원분야를 선택하세요"
                searchPlaceholder="지원분야 검색..."
                icon={<Briefcase className="w-4 h-4 text-blue-600" />}
                className="w-full"
              />
              <p className="mt-2 text-xs text-gray-500">
                지원분야를 선택하지 않으면 모든 분야의 지원사업 알림을 받게 됩니다. 특정 분야를 선택하면 해당 분야의 지원사업 알림을 받습니다.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
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