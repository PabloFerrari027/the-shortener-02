import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.e2e-spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '..',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  roots: ['<rootDir>/src', '<rootDir>/test'],
  passWithNoTests: true,
};

export default config;
