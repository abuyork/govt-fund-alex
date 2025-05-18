import React from 'react';

interface Payment {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: 'success' | 'failed' | 'refunded';
}

interface PaymentHistoryProps {
  payments: Payment[];
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  const getPaymentStatusColor = (status: string): string => {
    switch(status) {
      case 'success': return 'bg-green-100 text-green-600';
      case 'failed': return 'bg-red-100 text-red-600';
      case 'refunded': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPaymentStatusText = (status: string): string => {
    switch(status) {
      case 'success': return '성공';
      case 'failed': return '실패';
      case 'refunded': return '환불됨';
      default: return status;
    }
  };

  return (
    <div>
      <h4 className="text-lg font-semibold mb-4">결제 내역</h4>
      
      {payments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payment.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {payment.description}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(payment.status)}`}>
                      {getPaymentStatusText(payment.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          결제 내역이 없습니다.
        </div>
      )}
    </div>
  );
}