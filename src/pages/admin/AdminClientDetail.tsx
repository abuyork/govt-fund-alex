import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash } from 'lucide-react';

// Import components
import ClientHeader from '../../components/admin/client-detail/ClientHeader';
import CompanyInfo from '../../components/admin/client-detail/CompanyInfo';
import SubscriptionInfo from '../../components/admin/client-detail/SubscriptionInfo';
import PaymentHistory from '../../components/admin/client-detail/PaymentHistory';
import BusinessPlans from '../../components/admin/client-detail/BusinessPlans';
import DeleteAccountModal from '../../components/admin/client-detail/DeleteAccountModal';

// Types
import { Client } from '../../types/admin';

export default function AdminClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Mock data for a specific client
  const client: Client = {
    id: id || '',
    name: id === '1' ? '김철수' : id === '2' ? '이영희' : id === '3' ? '박민수' : id === '4' ? '최지은' : '정현우',
    email: id === '1' ? 'kim@example.com' : id === '2' ? 'lee@example.com' : id === '3' ? 'park@example.com' : id === '4' ? 'choi@example.com' : 'jung@example.com',
    plan: id === '1' ? 'free' : id === '2' ? 'standard' : id === '3' ? 'premium' : id === '4' ? 'standard' : 'free',
    status: id === '1' ? 'active' : id === '2' ? 'active' : id === '3' ? 'active' : id === '4' ? 'expired' : 'active',
    startDate: id === '1' ? '2024-01-15' : id === '2' ? '2024-02-10' : id === '3' ? '2024-03-05' : id === '4' ? '2023-10-20' : '2024-04-01',
    endDate: id === '1' ? '2025-01-15' : id === '2' ? '2024-08-10' : id === '3' ? '2024-06-05' : id === '4' ? '2024-04-20' : '2025-04-01',
    company: id === '1' ? '테크스타트' : id === '2' ? '그린에너지' : id === '3' ? '푸드테크' : id === '4' ? '디자인랩' : '스마트솔루션',
    businessNumber: id === '1' ? '123-45-67890' : id === '2' ? '234-56-78901' : id === '3' ? '345-67-89012' : id === '4' ? '456-78-90123' : '567-89-01234',
    phone: id === '1' ? '010-1234-5678' : id === '2' ? '010-2345-6789' : id === '3' ? '010-3456-7890' : id === '4' ? '010-4567-8901' : '010-5678-9012',
    address: id === '1' ? '서울시 강남구' : id === '2' ? '서울시 마포구' : id === '3' ? '부산시 해운대구' : id === '4' ? '인천시 송도동' : '대전시 유성구',
    paymentMethod: id === '1' ? '무료' : id === '2' ? '계좌이체' : id === '3' ? '카카오페이' : id === '4' ? '신용카드' : '무료',
    billingCycle: id === '1' ? '무료' : id === '2' ? '6개월' : id === '3' ? '3개월' : id === '4' ? '12개월' : '무료',
    lastPaymentDate: id === '1' ? '-' : id === '2' ? '2024-02-10' : id === '3' ? '2024-03-05' : id === '4' ? '2023-10-20' : '-',
    nextPaymentDate: id === '1' ? '-' : id === '2' ? '2024-08-10' : id === '3' ? '2024-06-05' : id === '4' ? '-' : '-',
    paymentHistory: id === '1' ? [] : [
      { 
        id: '1', 
        date: id === '2' ? '2024-02-10' : id === '3' ? '2024-03-05' : '2023-10-20', 
        amount: id === '2' ? 59400 : id === '3' ? 89700 : 118800, 
        description: `${id === '2' ? '스탠다드' : id === '3' ? '프리미엄' : '스탠다드'} 플랜 ${id === '2' ? '6개월' : id === '3' ? '3개월' : '12개월'} 구독`,
        status: 'success'
      },
      ...(id === '4' ? [] : [
        { 
          id: '2', 
          date: id === '2' ? '2023-08-10' : '2023-12-05', 
          amount: id === '2' ? 59400 : 89700, 
          description: `${id === '2' ? '스탠다드' : '프리미엄'} 플랜 ${id === '2' ? '6개월' : '3개월'} 구독`,
          status: 'success' 
        }
      ])
    ],
    businessPlans: [
      {
        id: '1',
        title: id === '1' ? '2024년 스타트업 성장지원 사업' : id === '2' ? '친환경 제품 개발 R&D 지원' : id === '3' ? '식품 안전 기술 지원 사업' : id === '4' ? '디자인 경쟁력 강화 지원 사업' : '스마트 솔루션 개발 지원 사업',
        type: id === '1' ? '사업계획서 초안' : id === '3' ? '제출용 사업계획서' : id === '4' ? '제출용 사업계획서' : '사업계획서 초안',
        createDate: id === '1' ? '2024-03-15' : id === '2' ? '2024-02-20' : id === '3' ? '2024-03-15' : id === '4' ? '2023-12-10' : '2024-04-05',
        lastEditDate: id === '1' ? '2024-03-20' : id === '2' ? '2024-03-05' : id === '3' ? '2024-04-02' : id === '4' ? '2024-01-25' : '2024-04-10'
      },
      ...(id === '1' || id === '5' ? [] : [
        {
          id: '2',
          title: id === '2' ? '지역 중소기업 지원 사업' : id === '3' ? '식품 수출 지원 프로그램' : '디자인 인력 양성 사업',
          type: id === '2' ? '제출용 사업계획서' : '제출용 사업계획서',
          createDate: id === '2' ? '2024-01-15' : id === '3' ? '2024-02-10' : '2023-11-05',
          lastEditDate: id === '2' ? '2024-01-30' : id === '3' ? '2024-02-28' : '2023-11-20'
        }
      ])
    ]
  };

  if (!client) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-semibold">고객 정보를 찾을 수 없습니다.</h3>
        <Link to="/admin/clients" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          고객 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const deleteClient = () => {
    // In a real application, this would send a request to delete the client
    navigate('/admin/clients');
  };

  return (
    <div>
      <div className="flex items-center space-x-3 mb-8">
        <Link to="/admin/clients" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h2 className="text-2xl font-bold">고객 상세 정보</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <ClientHeader
          name={client.name}
          email={client.email}
          plan={client.plan}
          status={client.status}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <CompanyInfo
            company={client.company}
            businessNumber={client.businessNumber}
            phone={client.phone}
            address={client.address}
          />
          
          <SubscriptionInfo
            startDate={client.startDate}
            endDate={client.endDate}
            paymentMethod={client.paymentMethod}
            billingCycle={client.billingCycle}
            nextPaymentDate={client.nextPaymentDate}
          />
        </div>
        
        <div className="border-t pt-6">
          <PaymentHistory payments={client.paymentHistory} />
        </div>
        
        <div className="border-t pt-6 mt-6">
          <BusinessPlans plans={client.businessPlans} />
        </div>
        
        <div className="border-t pt-6 mt-6">
          <h4 className="text-lg font-semibold mb-4 text-red-600">위험 구역</h4>
          <p className="text-sm text-gray-600 mb-4">
            계정을 삭제하면 모든 데이터가 영구적으로 제거됩니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <button 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash className="w-4 h-4 mr-2" />
            계정 삭제
          </button>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        clientName={client.name}
        onDelete={deleteClient}
      />
    </div>
  );
}