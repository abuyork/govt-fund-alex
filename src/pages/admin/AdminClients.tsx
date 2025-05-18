import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, CreditCard, Calendar, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock client data
interface Client {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'standard' | 'premium';
  status: 'active' | 'expired' | 'pending';
  startDate: string;
  endDate: string;
  company?: string;
  paymentMethod?: string;
}

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      name: '김철수',
      email: 'kim@example.com',
      plan: 'free',
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      company: '테크스타트',
      paymentMethod: '신용카드'
    },
    {
      id: '2',
      name: '이영희',
      email: 'lee@example.com',
      plan: 'standard',
      status: 'active',
      startDate: '2024-02-10',
      endDate: '2024-08-10',
      company: '그린에너지',
      paymentMethod: '계좌이체'
    },
    {
      id: '3',
      name: '박민수',
      email: 'park@example.com',
      plan: 'premium',
      status: 'active',
      startDate: '2024-03-05',
      endDate: '2024-06-05',
      company: '푸드테크',
      paymentMethod: '카카오페이'
    },
    {
      id: '4',
      name: '최지은',
      email: 'choi@example.com',
      plan: 'standard',
      status: 'expired',
      startDate: '2023-10-20',
      endDate: '2024-04-20',
      company: '디자인랩',
      paymentMethod: '신용카드'
    },
    {
      id: '5',
      name: '정현우',
      email: 'jung@example.com',
      plan: 'free',
      status: 'active',
      startDate: '2024-04-01',
      endDate: '2025-04-01',
      company: '스마트솔루션',
      paymentMethod: '무료'
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let result = clients;
    
    // Apply search term
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(client => 
        client.name.toLowerCase().includes(lowercasedTerm) || 
        client.email.toLowerCase().includes(lowercasedTerm) ||
        (client.company && client.company.toLowerCase().includes(lowercasedTerm))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(client => client.status === statusFilter);
    }
    
    // Apply plan filter
    if (planFilter !== 'all') {
      result = result.filter(client => client.plan === planFilter);
    }
    
    setFilteredClients(result);
  }, [searchTerm, statusFilter, planFilter, clients]);

  const getPlanDisplayName = (plan: string): string => {
    switch(plan) {
      case 'free': return '무료';
      case 'standard': return '스탠다드';
      case 'premium': return '프리미엄';
      default: return plan;
    }
  };

  const getPlanColorClass = (plan: string): string => {
    switch(plan) {
      case 'free': return 'bg-gray-100 text-gray-600';
      case 'standard': return 'bg-blue-100 text-blue-600';
      case 'premium': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusColorClass = (status: string): string => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-600';
      case 'expired': return 'bg-red-100 text-red-600';
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusDisplayName = (status: string): string => {
    switch(status) {
      case 'active': return '활성';
      case 'expired': return '만료됨';
      case 'pending': return '대기중';
      default: return status;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold">고객 관리</h2>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <h3 className="text-lg font-semibold mb-4 md:mb-0">고객 목록</h3>
          
          <div className="w-full md:w-64 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="고객 검색..."
              className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-blue-600"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className={`w-5 h-5 ${showFilters ? 'text-blue-600' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>
        
        {/* Filter Section */}
        {showFilters && (
          <div className="p-4 border rounded-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">필터</h4>
              <button 
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => {
                  setStatusFilter('all');
                  setPlanFilter('all');
                }}
              >
                필터 초기화
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">모든 상태</option>
                  <option value="active">활성</option>
                  <option value="expired">만료됨</option>
                  <option value="pending">대기중</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">요금제</label>
                <select
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                >
                  <option value="all">모든 요금제</option>
                  <option value="free">무료</option>
                  <option value="standard">스탠다드</option>
                  <option value="premium">프리미엄</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Clients List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객명/회사</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요금제</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구독기간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제방법</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상세</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{client.name}</div>
                      {client.company && (
                        <div className="text-sm text-gray-500">{client.company}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPlanColorClass(client.plan)}`}>
                        {getPlanDisplayName(client.plan)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColorClass(client.status)}`}>
                        {getStatusDisplayName(client.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDate(client.startDate)} ~ {formatDate(client.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-1 text-gray-400" />
                        {client.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link 
                        to={`/admin/clients/${client.id}`}
                        className="text-blue-600 hover:text-blue-900 flex items-center justify-center"
                      >
                        <span className="mr-1">상세</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}