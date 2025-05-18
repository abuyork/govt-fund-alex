import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Plus, Edit, Trash2, Search, User, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PlanType } from '../../services/paymentService';

type UserType = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in: string | null;
  plan_type: PlanType;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user',
    plan_type: 'free' as PlanType,
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('사용자 목록을 가져오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (user: UserType | null = null) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        email: user.email,
        password: '', // Don't set password on edit
        role: user.role,
        plan_type: user.plan_type || 'free',
      });
    } else {
      setCurrentUser(null);
      setFormData({
        email: '',
        password: '',
        role: 'user',
        plan_type: 'free',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add comprehensive logging
    console.log('Form submission starting with data:', formData);
    console.log('Current user being updated:', currentUser);
    
    try {
      if (currentUser) {
        // Update existing user
        const needsUpdate = formData.role !== currentUser.role || formData.plan_type !== currentUser.plan_type;
        console.log('Needs update?', needsUpdate, 'Role change:', formData.role !== currentUser.role, 'Plan change:', formData.plan_type !== currentUser.plan_type);
        
        if (needsUpdate) {
          // For admin role or plan changes, use a direct update
          console.log('Updating user with new data:', {
            email: formData.email,
            role: formData.role,
            plan_type: formData.plan_type,
            password: formData.password ? '(password provided)' : '(no password update)'
          });
          
          const { data: updateData, error: updateError } = await supabase
            .from('users')
            .update({ 
              email: formData.email,
              role: formData.role,
              plan_type: formData.plan_type,
              ...(formData.password ? { password: formData.password } : {})
            })
            .eq('id', currentUser.id)
            .select();
          
          console.log('Update response:', updateData, updateError);
          
          if (updateError) {
            // If direct update fails, try the RPC function as fallback for role
            console.log("Direct update failed, trying RPC function");
            const { error: roleError } = await supabase.rpc(
              'update_user_role',
              { 
                user_id: currentUser.id,
                new_role: formData.role 
              }
            );
            
            if (roleError) {
              console.error('Role update error:', roleError);
              throw roleError;
            }
          }
          
          // If plan type changed, update or create subscription
          if (formData.plan_type !== currentUser.plan_type) {
            console.log('Plan type changed, updating subscriptions');
            
            // First, update any active subscriptions to inactive
            const { error: subDeactivateError } = await supabase
              .from('subscriptions')
              .update({ is_active: false })
              .eq('user_id', currentUser.id)
              .eq('is_active', true);
              
            console.log('Deactivated old subscriptions, error:', subDeactivateError);
            
            // Create a new subscription if plan is not free
            if (formData.plan_type !== 'free') {
              console.log('Creating new subscription for plan:', formData.plan_type);
              const startDate = new Date();
              const endDate = new Date();
              endDate.setMonth(endDate.getMonth() + 1);
              
              const { data: subData, error: subError } = await supabase
                .from('subscriptions')
                .insert({
                  user_id: currentUser.id,
                  plan_type: formData.plan_type,
                  start_date: startDate.toISOString(),
                  end_date: endDate.toISOString(),
                  is_active: true,
                  auto_renew: true,
                  payment_id: 'admin_update'
                })
                .select();
                
              console.log('New subscription created:', subData, 'Error:', subError);
            }
          }
        } else {
          // If no role or plan changes, use the regular update for other fields
          console.log('No role/plan changes, just updating basic info');
          const { data, error } = await supabase
            .from('users')
            .update({ 
              email: formData.email,
              ...(formData.password ? { password: formData.password } : {})
            })
            .eq('id', currentUser.id);

          console.log('Basic update result:', data, error);
          if (error) throw error;
        }
        
        toast.success('사용자 정보가 업데이트되었습니다.');
      } else {
        // Create new user
        const { data, error } = await supabase
          .from('users')
          .insert([{ 
            email: formData.email, 
            password: formData.password, 
            role: formData.role,
            plan_type: formData.plan_type
          }])
          .select();

        if (error) throw error;
        
        // Create a subscription if the plan is not free
        if (formData.plan_type !== 'free' && data && data[0]) {
          const userId = data[0].id;
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);
          
          await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              plan_type: formData.plan_type,
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              is_active: true,
              auto_renew: true,
              payment_id: 'admin_created'
            });
        }
        
        toast.success('새 사용자가 추가되었습니다.');
      }
      
      fetchUsers();
      closeModal();
    } catch (error) {
      console.error('Error saving user:', error);
      // Log more detailed information about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Unknown error format:', typeof error, JSON.stringify(error));
      }
      toast.error('사용자 저장에 실패했습니다.');
    } finally {
      // Add a log when the operation completes
      console.log('User update operation completed');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('이 사용자를 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(users.filter(user => user.id !== userId));
      toast.success('사용자가 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('사용자 삭제에 실패했습니다.');
    }
  };

  const getPlanBadgeColor = (planType: PlanType) => {
    switch (planType) {
      case 'pro':
        return 'bg-blue-100 text-blue-800';
      case 'free':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> 새 사용자
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="이메일로 검색..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구독 플랜</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최근 로그인</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      getPlanBadgeColor(user.plan_type || 'free')
                    }`}>
                      {user.plan_type ? (user.plan_type === 'free' ? '무료 플랜' : '프로 플랜') : '무료 플랜'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="sr-only">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {currentUser ? '사용자 정보 수정' : '새 사용자 추가'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  비밀번호 {currentUser && <span className="font-normal text-xs">(변경 시에만 입력)</span>}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required={!currentUser}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                  역할
                </label>
                <select
                  id="role"
                  name="role"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="user">일반 사용자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="plan_type">
                  구독 플랜
                </label>
                <select
                  id="plan_type"
                  name="plan_type"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.plan_type}
                  onChange={handleInputChange}
                >
                  <option value="free">무료 플랜</option>
                  <option value="pro">프로 플랜</option>
                </select>
              </div>
              
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {currentUser ? '저장' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 