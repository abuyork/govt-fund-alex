import React, { useState } from 'react';
import { X, AlertCircle, Trash } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  onDelete: () => void;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  clientName,
  onDelete,
}: DeleteAccountModalProps) {
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-red-600">계정 삭제 확인</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-600 font-semibold">주의</p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{clientName}</span> 고객의 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              삭제를 확인하려면 <span className="font-semibold">"{clientName}"</span> 을(를) 입력하세요.
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button 
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            onClick={onClose}
          >
            취소
          </button>
          <button 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center disabled:bg-red-300 disabled:cursor-not-allowed"
            onClick={onDelete}
            disabled={deleteConfirmText !== clientName}
          >
            <Trash className="w-4 h-4 mr-2" />
            계정 삭제
          </button>
        </div>
      </div>
    </div>
  );
}