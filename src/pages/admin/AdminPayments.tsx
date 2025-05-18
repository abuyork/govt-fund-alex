import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Search, FileText, Download, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

type PaymentType = {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  created_at: string;
  payment_date: string | null;
  invoice_url: string | null;
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Fetch payments on component mount
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      // Join with users table to get email
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          users:user_id (email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format data to include user_email
      const formattedData = data?.map(item => ({
        ...item,
        user_email: item.users?.email || 'Unknown',
      })) || [];

      setPayments(formattedData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('결제 내역을 가져오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: 'pending' | 'completed' | 'failed') => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: newStatus,
          ...(newStatus === 'completed' ? { payment_date: new Date().toISOString() } : {})
        })
        .eq('id', paymentId);

      if (error) throw error;
      
      // Update the local state
      setPayments(payments.map(payment => 
        payment.id === paymentId 
          ? { 
              ...payment, 
              status: newStatus,
              ...(newStatus === 'completed' ? { payment_date: new Date().toISOString() } : {})
            } 
          : payment
      ));
      
      toast.success('결제 상태가 업데이트되었습니다.');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('결제 상태 업데이트에 실패했습니다.');
    }
  };

  // Apply filters
  const filteredPayments = payments.filter(payment => {
    // Search filter
    const matchesSearch = 
      payment.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.payment_method.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    // Date range filter
    let matchesDateRange = true;
    if (dateRange.start) {
      matchesDateRange = matchesDateRange && new Date(payment.created_at) >= new Date(dateRange.start);
    }
    if (dateRange.end) {
      // Add one day to include the end date
      const endDate = new Date(dateRange.end);
      endDate.setDate(endDate.getDate() + 1);
      matchesDateRange = matchesDateRange && new Date(payment.created_at) <= endDate;
    }
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  // Generate CSV for export
  const exportToCSV = () => {
    if (filteredPayments.length === 0) {
      toast.error('내보낼 데이터가 없습니다.');
      return;
    }
    
    const headers = ['ID', '사용자', '금액', '결제 방법', '상태', '생성일', '결제일'];
    const csvContent = [
      headers.join(','),
      ...filteredPayments.map(p => [
        p.id,
        p.user_email,
        p.amount,
        p.payment_method,
        p.status,
        new Date(p.created_at).toLocaleDateString(),
        p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payments-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">결제 내역</h1>
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Download className="w-4 h-4 mr-2" /> CSV 내보내기
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="검색..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div>
          <select
            className="w-full p-2 border border-gray-300 rounded-lg"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">모든 상태</option>
            <option value="pending">대기중</option>
            <option value="completed">완료</option>
            <option value="failed">실패</option>
          </select>
        </div>
        
        <div className="flex space-x-2">
          <input
            type="date"
            className="w-1/2 p-2 border border-gray-300 rounded-lg"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
          <input
            type="date"
            className="w-1/2 p-2 border border-gray-300 rounded-lg"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>
      </div>

      {/* Payments Table */}
      {isLoading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery || statusFilter !== 'all' || dateRange.start || dateRange.end 
            ? '검색 결과가 없습니다.' 
            : '결제 내역이 없습니다.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제 방법</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제일</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payment.user_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.payment_method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status === 'completed' ? '완료' : 
                       payment.status === 'pending' ? '대기중' : '실패'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {payment.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateStatus(payment.id, 'completed')}
                        className="text-green-600 hover:text-green-900 mr-2"
                        title="완료로 표시"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {payment.status !== 'failed' && (
                      <button
                        onClick={() => handleUpdateStatus(payment.id, 'failed')}
                        className="text-red-600 hover:text-red-900 mr-2"
                        title="실패로 표시"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {payment.invoice_url && (
                      <a
                        href={payment.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                        title="인보이스 보기"
                      >
                        <FileText className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 