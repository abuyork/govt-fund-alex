import React, { useState } from 'react';
import AdminUsers from './AdminUsers';
import AdminDiagnosis from './AdminDiagnosis';
import AdminPG from './AdminPG';
import AdminFundApplication from './AdminFundApplication';
import AdminTemplates from './AdminTemplates';
import AdminEmailConfig from './AdminEmailConfig';
import TemplatePreview from './TemplatePreview';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('users');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'users':
        return <AdminUsers />;
      case 'diagnosis':
        return <AdminDiagnosis />;
      case 'pg':
        return <AdminPG />;
      case 'fundApps':
        return <AdminFundApplication />;
      case 'templates':
        return <AdminTemplates />;
      case 'emailConfig':
        return <AdminEmailConfig />;
      case 'templatePreview':
        return <TemplatePreview />;
      default:
        return <AdminUsers />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">관리자 대시보드</h1>
      
      <div className="flex flex-wrap space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded ${activeTab === 'users' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          회원 관리
        </button>
        <button
          onClick={() => setActiveTab('diagnosis')}
          className={`px-4 py-2 rounded ${activeTab === 'diagnosis' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          진단 관리
        </button>
        <button
          onClick={() => setActiveTab('pg')}
          className={`px-4 py-2 rounded ${activeTab === 'pg' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          PG 설정
        </button>
        <button
          onClick={() => setActiveTab('fundApps')}
          className={`px-4 py-2 rounded ${activeTab === 'fundApps' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          지원금 신청관리
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded ${activeTab === 'templates' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          템플릿 관리
        </button>
        <button
          onClick={() => setActiveTab('emailConfig')}
          className={`px-4 py-2 rounded ${activeTab === 'emailConfig' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          이메일 설정
        </button>
        <button
          onClick={() => setActiveTab('templatePreview')}
          className={`px-4 py-2 rounded ${activeTab === 'templatePreview' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          템플릿 테스트
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default Admin; 