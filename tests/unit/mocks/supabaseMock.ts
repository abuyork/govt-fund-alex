// Mock types for Supabase responses to match PostgrestSingleResponse and other expected types
export type PostgrestError = {
  message: string;
  details: string;
  hint: string;
  code: string;
  name: string;
};

export type PostgrestResponseSuccess<T> = {
  data: T;
  error: null;
  count: number | null;
  status: number;
  statusText: string;
};

export type PostgrestResponseFailure = {
  data: null;
  error: PostgrestError;
  count: null;
  status: number;
  statusText: string;
};

export type PostgrestSingleResponse<T> = PostgrestResponseSuccess<T> | PostgrestResponseFailure;

// Helper to create a mock successful response
export function createSuccessResponse<T>(data: T): PostgrestResponseSuccess<T> {
  return {
    data,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK'
  };
}

// Helper to create a mock error response
export function createErrorResponse(message: string, code = 'ERROR', details = '', hint = ''): PostgrestResponseFailure {
  return {
    data: null,
    error: {
      message,
      details,
      hint,
      code,
      name: 'PostgrestError'
    },
    count: null,
    status: 400,
    statusText: 'Bad Request'
  };
}

// Helper to mock not found response
export function createNotFoundResponse(): PostgrestResponseFailure {
  return {
    data: null,
    error: {
      message: 'The requested resource was not found',
      details: '',
      hint: '',
      code: 'PGRST116',
      name: 'PostgrestError'
    },
    count: null,
    status: 404,
    statusText: 'Not Found'
  };
} 