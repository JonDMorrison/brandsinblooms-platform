/**
 * Jest Configuration for Visual Editor Test Suite
 * Milestone 6: Integration Testing and Security
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Custom Jest configuration for Visual Editor tests
const customJestConfig = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Test file patterns for Visual Editor
  testMatch: [
    '<rootDir>/src/tests/visual-editor/**/*.test.{js,jsx,ts,tsx}',
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/tests/visual-editor/setup.ts'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/components/content-editor/visual/**/*.{js,jsx,ts,tsx}',
    'src/contexts/VisualEditorContext.tsx',
    'src/hooks/useVisualEditor.ts',
    'src/lib/content/content-sanitization.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  // Coverage thresholds for Milestone 6
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // Specific thresholds for critical components
    'src/lib/content/content-sanitization.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    'src/contexts/VisualEditorContext.tsx': {
      branches: 95,
      functions: 98,
      lines: 98,
      statements: 98,
    },
  },

  // Module path mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$|@supabase))',
  ],

  // Test timeout for comprehensive tests
  testTimeout: 30000,

  // Globals for browser environment simulation
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },

  // Mock configuration
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock CSS and static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // Clear mocks between tests
  clearMocks: true,
  
  // Reset modules between tests
  resetMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output for debugging
  verbose: true,

  // Test result processors
  testResultsProcessor: '<rootDir>/src/tests/visual-editor/test-results-processor.js',

  // Custom test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3001',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },

  // Performance testing configuration
  slowTestThreshold: 5000, // 5 seconds

  // Error on deprecated features
  errorOnDeprecated: true,

  // Fail fast on first test failure (useful for CI)
  bail: process.env.CI ? 1 : 0,

  // Max worker processes
  maxWorkers: process.env.CI ? 2 : '50%',

  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',

  // Watch plugins for development
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Test reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results',
        outputName: 'visual-editor-results.xml',
        suiteName: 'Visual Editor Test Suite',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
    [
      'jest-html-reporter',
      {
        pageTitle: 'Visual Editor Test Report',
        outputPath: '<rootDir>/test-results/visual-editor-report.html',
        includeFailureMsg: true,
        includeSuiteFailure: true,
        theme: 'lightTheme',
      },
    ],
  ],

  // Custom matchers and utilities
  globalSetup: '<rootDir>/src/tests/visual-editor/global-setup.js',
  globalTeardown: '<rootDir>/src/tests/visual-editor/global-teardown.js',
};

// Export the final configuration
module.exports = createJestConfig(customJestConfig);