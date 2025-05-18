import toast from 'react-hot-toast';

/**
 * Shows a toast notification guiding the user on how to select download formats
 */
export const showDownloadFormatGuide = () => {
  toast.success(
    '다운로드 형식을 선택하세요: TXT, PDF, DOCX',
    {
      duration: 4000,
      position: 'bottom-center',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
        padding: '16px',
        fontSize: '14px'
      },
      icon: '📥'
    }
  );
}; 