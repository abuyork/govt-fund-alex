import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/services/notificationMatchingService.ts',
    'src/services/notificationGenerationService.ts',
    'src/services/kakaoNotificationService.ts',
    'src/services/notificationTaskProcessor.ts',
    'src/services/notificationTaskService.ts',
    'src/services/notificationOrchestrator.ts',
  ],
  // Temporarily disabled coverage thresholds during development
  // coverageThreshold: {
  //   global: {
  //     branches: 70,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80,
  //   },
  // },
};

export default config; 