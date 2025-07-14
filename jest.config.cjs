module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/lib/env$': '<rootDir>/__mocks__/envMock.ts',
    'env$': '<rootDir>/__mocks__/envMock.ts',
    '^marked$': '<rootDir>/__mocks__/markedMock.js',
    'voiceService\\.js$': '<rootDir>/__mocks__/emptyModule.js',
    'bitrixService\\.js$': '<rootDir>/__mocks__/emptyModule.js',
    'navigationService\\.js$': '<rootDir>/__mocks__/emptyModule.js',
    'reminderService\\.js$': '<rootDir>/__mocks__/emptyModule.js',
    'smsService\\.js$': '<rootDir>/__mocks__/emptyModule.js',
    'smsHandler\\.js$': '<rootDir>/__mocks__/smsHandlerMock.js',
    'cacheMiddleware\\.js$': '<rootDir>/__mocks__/emptyModule.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.jest.json',
        diagnostics: false,
        compilerOptions: {
          module: 'esnext'
        }
      }
    ],
    '^.+\\.js$': 'babel-jest'
  },
  extensionsToTreatAsEsm: ['.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json'
    }
  }
}; 