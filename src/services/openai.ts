/**
 * OpenAI Service
 * This file provides functions to interact with the OpenAI API for generating business plans
 */
import OpenAI from 'openai';
// Remove import from prompts.ts
// import { BUSINESS_PLAN_SYSTEM_PROMPT, BUSINESS_PLAN_STREAM_SYSTEM_PROMPT } from './prompts';
// Don't hardcode any specific template
// import { BASIC_STARTUP_SYSTEM_PROMPT } from './templates/basicStartupTemplate';

// Initialize the OpenAI client
const openai = new OpenAI({
  // For development - accessing environment variables in browser context
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'dummy-key-for-development',
  dangerouslyAllowBrowser: true, // Only use this in development. For production, use a backend proxy
});

// Define a generic system prompt instead of using a specific template's system prompt
const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant specializing in creating professional business plans in Korean.
Follow the template structure exactly as provided in the user's prompt.
Ensure your response follows all formatting guidelines specified in the template.
Do not add additional headers or sections not specified in the template.
Keep responses concise and professional, focusing on the business context provided.

중요: 모든 응답은 100% 한국어로만 작성해야 합니다.
영어로 된 제목이나 헤더를 사용하지 마세요 (예: "Basic Startup Template (Free)" 같은 템플릿 제목 포함).
모든 섹션 제목과 내용은 한국어로만 작성하세요.
영어 단어나 문장을 한국어로 번역해서 사용하세요.
특히 템플릿 이름을 출력하지 마세요 - 한국어로 된 내용만 출력하세요.`;

// // Use the basic startup system prompt as the default system prompt
// const DEFAULT_SYSTEM_PROMPT = BASIC_STARTUP_SYSTEM_PROMPT;

// // Export the function to allow for customized system prompts
// export const getSystemPrompt = (templateId?: string) => {
//   // This function could be expanded to return different system prompts based on templateId
//   return DEFAULT_SYSTEM_PROMPT;
// };

export interface OpenAIResponse {
  success: boolean;
  content?: string;
  error?: string;
}

// Function to check if OpenAI API is configured
export const isOpenAIConfigured = (): boolean => {
  return !!openai.apiKey && openai.apiKey !== 'dummy-key-for-development';
};

// // Export the template functions to allow for customized system prompts
// export * as templates from './templates';

/**
 * Generate business plan content using OpenAI
 * @param prompt The prompt to send to the OpenAI API
 * @param temperature Controls randomness (0-1), default 0.7
 * @returns Response object with generated content or error
 */
export const generateBusinessPlan = async (
  prompt: string,
  temperature = 0.7
): Promise<OpenAIResponse> => {
  try {
    if (!openai.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key is not configured. Please add your API key to environment variables.',
      };
    }

    // Ensure temperature is within OpenAI's recommended range (0-1)
    const safeTemperature = Math.max(0, Math.min(1, temperature));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // You can also use 'gpt-3.5-turbo' for a less expensive option
      messages: [
        {
          role: 'system',
          content: DEFAULT_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: safeTemperature,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // Extract the content from the response
    const content = response.choices[0]?.message?.content?.trim();

    if (!content) {
      return {
        success: false,
        error: 'Failed to generate content. The API returned an empty response.',
      };
    }

    return {
      success: true,
      content,
    };
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    // Handle rate limiting errors specifically
    if (error.status === 429) {
      return {
        success: false,
        error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      };
    }
    
    // Handle invalid API key
    if (error.status === 401) {
      return {
        success: false,
        error: 'API 키가 유효하지 않습니다. API 키를 확인해주세요.',
      };
    }

    return {
      success: false,
      error: error.message || 'An unknown error occurred while generating the business plan.',
    };
  }
};

/**
 * Generate business plan content using streaming for more responsive UI
 * @param prompt The prompt to send to the OpenAI API
 * @param onContent Callback function that receives content as it's generated
 * @param onError Callback function that receives any errors
 * @param temperature Controls randomness (0-1), default 0.7
 */
export const generateBusinessPlanStream = async (
  prompt: string,
  onContent: (content: string) => void,
  onError: (error: string) => void,
  temperature = 0.7
): Promise<void> => {
  try {
    if (!openai.apiKey) {
      onError('OpenAI API key is not configured. Please add your API key to environment variables.');
      return;
    }

    // Ensure temperature is within OpenAI's recommended range (0-1)
    const safeTemperature = Math.max(0, Math.min(1, temperature));

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: DEFAULT_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: safeTemperature,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: true,
    });

    // Process the stream
    let contentSoFar = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      contentSoFar += content;
      onContent(contentSoFar);
    }
  } catch (error: any) {
    console.error('OpenAI API Streaming Error:', error);
    
    // Handle rate limiting errors specifically
    if (error.status === 429) {
      onError('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    // Handle invalid API key
    if (error.status === 401) {
      onError('API 키가 유효하지 않습니다. API 키를 확인해주세요.');
      return;
    }

    onError(error.message || 'An unknown error occurred while generating the business plan.');
  }
}; 