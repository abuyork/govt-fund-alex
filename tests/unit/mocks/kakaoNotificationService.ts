export const createMessageQueueEntry = jest.fn().mockResolvedValue({
  success: true
});

export const processMessageQueue = jest.fn().mockResolvedValue({
  sent: 1,
  failed: 0,
  requeued: 0
});

export const sendKakaoNotification = jest.fn().mockResolvedValue({
  success: true
}); 