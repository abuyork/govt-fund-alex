import React, { useState, useEffect } from 'react';
import { getUserNotificationSettings, saveNotificationSettings } from '../services/userNotificationService';
import { sendKakaoNotification, createMessageQueueEntry, processMessageQueue } from '../services/kakaoNotificationService';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';

export default function Test() {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingNotification, setTestingNotification] = useState(false);
  const [testingQueue, setTestingQueue] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Get notification settings
          const notificationSettings = await getUserNotificationSettings();
          setSettings(notificationSettings);
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleCreateTable = async () => {
    try {
      const { error } = await supabase.rpc('create_notification_settings_table');
      
      if (error) {
        toast.error(`Error creating table: ${error.message}`);
        return;
      }
      
      toast.success('Notification settings table created successfully!');
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
      console.error('Error creating table:', err);
    }
  };

  const handleCreateQueueTable = async () => {
    try {
      const { error } = await supabase.rpc('create_message_queue_table');
      
      if (error) {
        toast.error(`Error creating message queue table: ${error.message}`);
        return;
      }
      
      toast.success('Message queue table created successfully!');
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
      console.error('Error creating message queue table:', err);
    }
  };

  const handleTestSave = async () => {
    try {
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      const testSettings = {
        userId: user.id,
        kakaoLinked: false,
        newProgramsAlert: true,
        notificationFrequency: 'daily' as const,
        notificationTime: '09:00',
        deadlineNotification: true,
        deadlineDays: 3,
        regions: ['서울', '부산'],
        categories: ['자금', '기술']
      };

      const result = await saveNotificationSettings(testSettings);
      
      if (result.success) {
        toast.success('Test settings saved successfully!');
        // Refresh settings
        const notificationSettings = await getUserNotificationSettings();
        setSettings(notificationSettings);
      } else {
        toast.error(`Error saving settings: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
      console.error('Error saving test settings:', err);
    }
  };
  
  const handleTestNotification = async () => {
    try {
      if (!user) {
        toast.error('User not authenticated');
        return;
      }
      
      if (!settings?.kakao_linked) {
        toast.error('KakaoTalk is not linked. Please link KakaoTalk first.');
        return;
      }
      
      setTestingNotification(true);
      const result = await sendKakaoNotification(
        user.id, 
        '테스트 알림: 이 메시지는 Kakao API 연동 테스트입니다.', 
        window.location.origin
      );
      
      if (result.success) {
        toast.success('Test notification sent successfully!');
      } else {
        toast.error(`Error sending notification: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
      console.error('Error sending test notification:', err);
    } finally {
      setTestingNotification(false);
    }
  };
  
  const handleTestMessageQueue = async () => {
    try {
      if (!user) {
        toast.error('User not authenticated');
        return;
      }
      
      setTestingQueue(true);
      
      // First create a test queue entry
      const queueResult = await createMessageQueueEntry(
        user.id,
        'test-program-001',
        '테스트 지원 프로그램',
        window.location.origin,
        'new_program'
      );
      
      if (!queueResult.success) {
        toast.error(`Error creating test queue entry: ${queueResult.error}`);
        return;
      }
      
      toast.success('Created test message queue entry successfully!');
      
      // Now process the queue
      const processResult = await processMessageQueue();
      
      if (processResult.sent > 0) {
        toast.success(`Processed ${processResult.sent} messages from queue!`);
      } else {
        toast.error(`Failed to process messages. Failures: ${processResult.failed}`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
      console.error('Error testing message queue:', err);
    } finally {
      setTestingQueue(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Notification System Test</h1>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <p className="mb-2">
              <strong>User Status:</strong> {user ? 'Authenticated' : 'Not Authenticated'}
            </p>
            {user && (
              <div className="mt-2">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
        {loading ? (
          <p>Loading...</p>
        ) : settings ? (
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-80">
            {JSON.stringify(settings, null, 2)}
          </pre>
        ) : (
          <p>No notification settings found.</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Database Tables</h2>
          <div className="flex flex-col space-y-4">
            <button 
              onClick={handleCreateTable}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Create Notification Settings Table
            </button>
            
            <button 
              onClick={handleCreateQueueTable}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Create Message Queue Table
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Data</h2>
          <div className="flex flex-col space-y-4">
            <button 
              onClick={handleTestSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              disabled={!user}
            >
              Save Test Notification Settings
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test KakaoTalk Notification</h2>
        <p className="mb-4 text-sm text-gray-600">
          This will test sending a direct KakaoTalk notification to your linked account. 
          Requires KakaoTalk to be linked in your notification settings.
        </p>
        <div className="flex flex-col space-y-4">
          <button 
            onClick={handleTestNotification}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
            disabled={!user || testingNotification || !settings?.kakao_linked}
          >
            {testingNotification ? 'Testing...' : 'Send Test Notification'}
          </button>
          
          <button 
            onClick={handleTestMessageQueue}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            disabled={!user || testingQueue}
          >
            {testingQueue ? 'Testing...' : 'Test Message Queue Process'}
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> KakaoTalk business messaging requires additional credentials.
            Please ask your boss for the Kakao Business API key and Sender Key to enable actual message sending.
          </p>
        </div>
      </div>
    </div>
  );
} 