import React from 'react';
import { User, Mail, Lock } from 'lucide-react';

export default function Settings() {
  return (
    <div>
      <div className="flex items-center space-x-3 mb-8">
        <User className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold">설정</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">계정 정보</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <input
                type="email"
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="이메일을 입력하세요"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 변경
            </label>
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-gray-400" />
              <input
                type="password"
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="새 비밀번호"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          저장하기
        </button>
      </div>
    </div>
  );
}