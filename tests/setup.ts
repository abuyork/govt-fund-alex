// Global setup for tests

// Mock environment variables
process.env.VITE_KAKAO_CLIENT_ID = 'test-kakao-client-id';
process.env.VITE_KAKAO_ADMIN_KEY = 'test-kakao-admin-key';
process.env.VITE_KAKAO_SENDER_KEY = 'test-kakao-sender-key';
process.env.MODE = 'test';

// Mock Supabase
jest.mock('../src/services/supabase', () => ({
  supabase: {
    from: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  },
}));

// Mock KakaoNotificationService
jest.mock('../src/services/kakaoNotificationService', () => {
  return require('./unit/mocks/kakaoNotificationService');
});

// Mock import.meta.env
jest.mock('vite', () => ({
  defineConfig: jest.fn(),
}), { virtual: true });

// Add import.meta.env to global
global.import = { 
  meta: { 
    env: { 
      VITE_KAKAO_CLIENT_ID: 'test-kakao-client-id',
      VITE_KAKAO_ADMIN_KEY: 'test-kakao-admin-key',
      VITE_KAKAO_SENDER_KEY: 'test-kakao-sender-key',
      MODE: 'test'
    } 
  } 
} as any;

// Mock console.error and console.log to keep test output clean
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

// Jest setup file
import '@testing-library/jest-dom';

// Mock import.meta.env for Vite environment variables 
// This will be applied before any test is executed
global.import = {};
global.import.meta = {
  env: {
    VITE_BIZINFO_API_KEY: 'mock-api-key',
    VITE_KAKAO_CLIENT_ID: 'mock-client-id',
    VITE_KAKAO_ADMIN_KEY: 'mock-admin-key',
    VITE_KAKAO_SENDER_KEY: 'mock-sender-key',
    VITE_SUPABASE_URL: 'https://mock-supabase-url.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'mock-anon-key',
    VITE_APP_URL: 'http://localhost:3000',
    MODE: 'test',
    DEV: true,
    PROD: false
  }
};

// Mock fetch API
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    statusText: 'OK'
  })
) as jest.Mock;

// Mock localStorage
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

// Set up localStorage mock
Object.defineProperty(global, 'localStorage', {
  value: new LocalStorageMock(),
  writable: true
});

// Set test environment variables
process.env.NODE_ENV = 'test';

// Suppress console errors/warnings during tests
global.console.error = jest.fn();
global.console.warn = jest.fn();

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
}); 