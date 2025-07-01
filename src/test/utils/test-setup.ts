// Test setup utilities for MCP Appium test suite

// Global test configuration
const originalLog = console.log;

// Setup function to initialize test environment
export const setupTestEnvironment = () => {
  console.log("Starting XcodeCommands test suite...");
};

// Cleanup function to restore environment after tests
export const cleanupTestEnvironment = () => {
  console.log("XcodeCommands test suite completed.");
};

// Mock console to reduce noise during tests
export const mockConsole = () => {
  console.log = (...args: any[]) => {
    originalLog.apply(console, args);
  };
};
