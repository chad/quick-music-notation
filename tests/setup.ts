// Jest setup file

// Add custom matchers if needed
// import '@testing-library/jest-dom';

// Mock window.requestAnimationFrame for tests that might use it
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 0) as unknown as number;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock console methods to reduce noise in test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((message?: any, ...optionalParams: any[]) => {
    // Only show actual errors, not expected ones
    if (typeof message === 'string' && message.includes('Handler error')) {
      return;
    }
    originalError(message, ...optionalParams);
  });
  
  console.warn = jest.fn((message?: any, ...optionalParams: any[]) => {
    // Filter out expected warnings
    if (typeof message === 'string' && message.includes('Voice formatting failed')) {
      return;
    }
    originalWarn(message, ...optionalParams);
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});