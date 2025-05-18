import {
    createTask,
    getNextPendingTask,
    initializeTaskSystem,
    NotificationTask,
    updateTaskStatus
} from '../../src/services/notificationTaskService';
import { supabase } from '../../src/services/supabase';

// Mock the Supabase module
jest.mock('../../src/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Notification Task Service', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('initializeTaskSystem', () => {
    test('should return true if table already exists', async () => {
      // Mock supabase query to return success (table exists)
      const fromSpy = jest.fn().mockReturnThis();
      const selectSpy = jest.fn().mockReturnThis();
      const limitSpy = jest.fn().mockResolvedValue({ data: [], error: null });
      
      mockSupabase.from.mockImplementation(() => ({
        select: selectSpy,
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      } as any));
      
      selectSpy.mockReturnValue({ limit: limitSpy });
      
      const result = await initializeTaskSystem();
      
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_tasks');
      expect(selectSpy).toHaveBeenCalledWith('id');
      expect(limitSpy).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
    
    test('should create table if it does not exist', async () => {
      // Mock table check to fail (table doesn't exist)
      const fromSpy = jest.fn().mockReturnThis();
      const selectSpy = jest.fn().mockReturnThis();
      const limitSpy = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });
      
      mockSupabase.from.mockImplementation(() => ({
        select: selectSpy,
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      } as any));
      
      selectSpy.mockReturnValue({ limit: limitSpy });
      
      // Mock RPC to create table
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      const result = await initializeTaskSystem();
      
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_tasks');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_notification_tasks_table');
      expect(result).toBe(true);
    });
    
    test('should try direct SQL if RPC fails', async () => {
      // Mock table check to fail (table doesn't exist)
      const fromSpy = jest.fn().mockReturnThis();
      const selectSpy = jest.fn().mockReturnThis();
      const limitSpy = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });
      
      mockSupabase.from.mockImplementation(() => ({
        select: selectSpy,
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      } as any));
      
      selectSpy.mockReturnValue({ limit: limitSpy });
      
      // Mock RPC to fail
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: null, error: { message: 'RPC not found' } })
        .mockResolvedValueOnce({ data: null, error: null }); // SQL succeeds
      
      const result = await initializeTaskSystem();
      
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_tasks');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_notification_tasks_table');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('run_sql', expect.any(Object));
      expect(result).toBe(true);
    });
  });
  
  describe('createTask', () => {
    test('should create a new task successfully', async () => {
      const taskData: NotificationTask = {
        id: 'task-123',
        task_type: 'fetch',
        status: 'pending',
        parameters: { key: 'value' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        retry_count: 0,
        parent_task_id: null
      };
      
      const fromSpy = jest.fn().mockReturnThis();
      const insertSpy = jest.fn().mockReturnThis();
      const selectSpy = jest.fn().mockReturnThis();
      const singleSpy = jest.fn().mockResolvedValue({
        data: taskData,
        error: null
      });
      
      mockSupabase.from.mockImplementation(() => ({
        insert: insertSpy,
        select: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      } as any));
      
      insertSpy.mockReturnValue({ select: selectSpy });
      selectSpy.mockReturnValue({ single: singleSpy });
      
      const result = await createTask('fetch', { key: 'value' });
      
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_tasks');
      expect(insertSpy).toHaveBeenCalledWith({
        task_type: 'fetch',
        status: 'pending',
        parameters: { key: 'value' },
        retry_count: 0,
        parent_task_id: null
      });
      expect(result).toEqual(taskData);
    });
    
    test('should handle creation errors', async () => {
      const fromSpy = jest.fn().mockReturnThis();
      const insertSpy = jest.fn().mockReturnThis();
      const selectSpy = jest.fn().mockReturnThis();
      const singleSpy = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'ERROR', message: 'Database error' }
      });
      
      mockSupabase.from.mockImplementation(() => ({
        insert: insertSpy,
        select: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      } as any));
      
      insertSpy.mockReturnValue({ select: selectSpy });
      selectSpy.mockReturnValue({ single: singleSpy });
      
      const result = await createTask('fetch', { key: 'value' });
      
      expect(result).toBeNull();
    });
    
    test('should create a task with parent task ID', async () => {
      const taskData: NotificationTask = {
        id: 'task-123',
        task_type: 'match',
        status: 'pending',
        parameters: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        retry_count: 0,
        parent_task_id: 'parent-task-id'
      };
      
      const fromSpy = jest.fn().mockReturnThis();
      const insertSpy = jest.fn().mockReturnThis();
      const selectSpy = jest.fn().mockReturnThis();
      const singleSpy = jest.fn().mockResolvedValue({
        data: taskData,
        error: null
      });
      
      mockSupabase.from.mockImplementation(() => ({
        insert: insertSpy,
        select: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      } as any));
      
      insertSpy.mockReturnValue({ select: selectSpy });
      selectSpy.mockReturnValue({ single: singleSpy });
      
      const result = await createTask('match', {}, 'parent-task-id');
      
      expect(insertSpy).toHaveBeenCalledWith({
        task_type: 'match',
        status: 'pending',
        parameters: {},
        retry_count: 0,
        parent_task_id: 'parent-task-id'
      });
      expect(result?.parent_task_id).toBe('parent-task-id');
    });
  });
  
  describe('getNextPendingTask', () => {
    test('should get next pending task of any type', async () => {
      const taskData: NotificationTask = {
        id: 'task-123',
        task_type: 'fetch',
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      const fromSpy = jest.fn().mockReturnThis();
      const selectSpy = jest.fn().mockReturnThis();
      const eqSpy = jest.fn().mockReturnThis();
      const orderSpy = jest.fn().mockReturnThis();
      const limitSpy = jest.fn().mockReturnThis();
      const singleSpy = jest.fn().mockResolvedValue({
        data: taskData,
        error: null
      });
      
      mockSupabase.from.mockImplementation(() => ({
        select: selectSpy,
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      } as any));
      
      selectSpy.mockReturnValue({ eq: eqSpy });
      eqSpy.mockReturnValue({ order: orderSpy });
      orderSpy.mockReturnValue({ limit: limitSpy });
      limitSpy.mockReturnValue({ single: singleSpy });
      
      const result = await getNextPendingTask();
      
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_tasks');
      expect(selectSpy).toHaveBeenCalledWith('*');
      expect(eqSpy).toHaveBeenCalledWith('status', 'pending');
      expect(orderSpy).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(limitSpy).toHaveBeenCalledWith(1);
      expect(result).toEqual(taskData);
    });
    
    test('should get next pending task of specific type', async () => {
      const taskData: NotificationTask = {
        id: 'task-123',
        task_type: 'match',
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      const fromSpy = jest.fn().mockReturnThis();
      const selectSpy = jest.fn().mockReturnThis();
      const eqStatusSpy = jest.fn().mockReturnThis();
      const eqTypeSpy = jest.fn().mockReturnThis();
      const orderSpy = jest.fn().mockReturnThis();
      const limitSpy = jest.fn().mockReturnThis();
      const singleSpy = jest.fn().mockResolvedValue({
        data: taskData,
        error: null
      });
      
      mockSupabase.from.mockImplementation(() => ({
        select: selectSpy,
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      } as any));
      
      selectSpy.mockReturnValue({ eq: eqStatusSpy });
      eqStatusSpy.mockReturnValue({ eq: eqTypeSpy, order: orderSpy });
      eqTypeSpy.mockReturnValue({ order: orderSpy });
      orderSpy.mockReturnValue({ limit: limitSpy });
      limitSpy.mockReturnValue({ single: singleSpy });
      
      const result = await getNextPendingTask('match');
      
      expect(eqStatusSpy).toHaveBeenCalledWith('status', 'pending');
      expect(eqTypeSpy).toHaveBeenCalledWith('task_type', 'match');
      expect(result).toEqual(taskData);
    });
    
    test('should return null if no pending tasks found', async () => {
      const fromSpy = jest.fn().mockReturnThis();
      const selectSpy = jest.fn().mockReturnThis();
      const eqSpy = jest.fn().mockReturnThis();
      const orderSpy = jest.fn().mockReturnThis();
      const limitSpy = jest.fn().mockReturnThis();
      const singleSpy = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });
      
      mockSupabase.from.mockImplementation(() => ({
        select: selectSpy,
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      } as any));
      
      selectSpy.mockReturnValue({ eq: eqSpy });
      eqSpy.mockReturnValue({ order: orderSpy });
      orderSpy.mockReturnValue({ limit: limitSpy });
      limitSpy.mockReturnValue({ single: singleSpy });
      
      const result = await getNextPendingTask();
      
      expect(result).toBeNull();
    });
  });
  
  describe('updateTaskStatus', () => {
    test('should update task status successfully', async () => {
      const fromSpy = jest.fn().mockReturnThis();
      const updateSpy = jest.fn().mockReturnThis();
      const eqSpy = jest.fn().mockResolvedValue({ data: null, error: null });
      
      mockSupabase.from.mockImplementation(() => ({
        update: updateSpy,
        insert: jest.fn(),
        select: jest.fn(),
        delete: jest.fn()
      } as any));
      
      updateSpy.mockReturnValue({ eq: eqSpy });
      
      const result = await updateTaskStatus('task-123', 'completed', { result: 'success' });
      
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_tasks');
      expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'completed',
        updated_at: expect.any(String),
        completed_at: expect.any(String),
        result: { result: 'success' }
      }));
      expect(eqSpy).toHaveBeenCalledWith('id', 'task-123');
      expect(result).toBe(true);
    });
    
    test('should set started_at when transitioning to processing', async () => {
      const fromSpy = jest.fn().mockReturnThis();
      const updateSpy = jest.fn().mockReturnThis();
      const eqSpy = jest.fn().mockResolvedValue({ data: null, error: null });
      
      mockSupabase.from.mockImplementation(() => ({
        update: updateSpy,
        insert: jest.fn(),
        select: jest.fn(),
        delete: jest.fn()
      } as any));
      
      updateSpy.mockReturnValue({ eq: eqSpy });
      
      await updateTaskStatus('task-123', 'processing');
      
      expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'processing',
        started_at: expect.any(String)
      }));
    });
    
    test('should handle error message', async () => {
      const fromSpy = jest.fn().mockReturnThis();
      const updateSpy = jest.fn().mockReturnThis();
      const eqSpy = jest.fn().mockResolvedValue({ data: null, error: null });
      
      mockSupabase.from.mockImplementation(() => ({
        update: updateSpy,
        insert: jest.fn(),
        select: jest.fn(),
        delete: jest.fn()
      } as any));
      
      updateSpy.mockReturnValue({ eq: eqSpy });
      
      await updateTaskStatus('task-123', 'failed', undefined, 'Task failed with error');
      
      expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'failed',
        error: 'Task failed with error'
      }));
    });
  });
  
  // Add tests for remaining functions as needed
}); 