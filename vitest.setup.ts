import '@testing-library/jest-dom';

// Mock requestAnimationFrame for tests
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock Worker for tests
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((error: ErrorEvent) => void) | null = null;
  
  postMessage(message: unknown) {
    // Simulate async response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: message } as MessageEvent);
      }
    }, 0);
  }
  
  terminate() {
    // no-op
  }
}

global.Worker = MockWorker as any;