import React, { useState } from 'react';
import { checkUserNotificationTime, testTimeBasedNotification } from '../../services/notificationTestService';
import { supabase } from '../../services/supabase';

const TestNotifications: React.FC = () => {
    const [testResults, setTestResults] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [userId, setUserId] = useState<string>('');
    const [hour, setHour] = useState<string>('');
    const [minute, setMinute] = useState<string>('');
    const [userCheckResults, setUserCheckResults] = useState<string>('');

    // Test the time-based notification system
    const handleTestTimeCheck = async () => {
        setIsLoading(true);
        setTestResults('');

        try {
            // Convert hour and minute to numbers, or undefined to use current time
            const hourNum = hour ? parseInt(hour) : undefined;
            const minuteNum = minute ? parseInt(minute) : undefined;

            const result = await testTimeBasedNotification(hourNum, minuteNum);
            setTestResults(JSON.stringify(result, null, 2));
        } catch (error) {
            setTestResults(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Check a specific user's notification settings
    const handleCheckUser = async () => {
        if (!userId) {
            setUserCheckResults('Please enter a user ID');
            return;
        }

        setIsLoading(true);
        setUserCheckResults('');

        try {
            const result = await checkUserNotificationTime(userId);
            setUserCheckResults(JSON.stringify(result, null, 2));
        } catch (error) {
            setUserCheckResults(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Get all users with notification settings
    const handleListUsers = async () => {
        setIsLoading(true);
        setTestResults('');

        try {
            const { data, error } = await supabase
                .from('user_notification_settings')
                .select('user_id, notification_time, kakao_linked, new_programs_alert, deadline_notification')
                .order('notification_time');

            if (error) {
                throw error;
            }

            setTestResults(JSON.stringify(data, null, 2));
        } catch (error) {
            setTestResults(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Notification System Test Panel</h1>

            <div className="bg-white p-6 rounded shadow mb-8">
                <h2 className="text-xl font-semibold mb-4">Test Time-Based Notifications</h2>

                <div className="flex gap-4 mb-4">
                    <div className="w-1/2">
                        <label className="block mb-2">Hour (0-23, empty for current time)</label>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            className="w-full p-2 border rounded"
                            value={hour}
                            onChange={(e) => setHour(e.target.value)}
                            placeholder="Hour (0-23)"
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block mb-2">Minute (0-59, empty for current time)</label>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            className="w-full p-2 border rounded"
                            value={minute}
                            onChange={(e) => setMinute(e.target.value)}
                            placeholder="Minute (0-59)"
                        />
                    </div>
                </div>

                <div className="flex gap-4 mb-4">
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300"
                        onClick={handleTestTimeCheck}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Testing...' : 'Test Time Check'}
                    </button>

                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-green-300"
                        onClick={handleListUsers}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'List All Users'}
                    </button>
                </div>

                {testResults && (
                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">Results:</h3>
                        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap overflow-auto max-h-96">
                            {testResults}
                        </pre>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded shadow">
                <h2 className="text-xl font-semibold mb-4">Check User Notification Settings</h2>

                <div className="mb-4">
                    <label className="block mb-2">User ID</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Enter user ID"
                    />
                </div>

                <button
                    className="bg-purple-600 text-white px-4 py-2 rounded disabled:bg-purple-300"
                    onClick={handleCheckUser}
                    disabled={isLoading || !userId}
                >
                    {isLoading ? 'Checking...' : 'Check User'}
                </button>

                {userCheckResults && (
                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">User Settings:</h3>
                        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap overflow-auto max-h-96">
                            {userCheckResults}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestNotifications; 