import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../utils/apiClient';
import { toast } from 'react-toastify';

// Mock toast
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Network Error Handling and Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  describe('API Client Retry Logic', () => {
    it('should retry failed requests up to 2 times', async () => {
      let attemptCount = 0;
      global.fetch = vi.fn(() => {
        attemptCount++;
        return Promise.reject(new Error('Network error'));
      });

      try {
        await apiClient.get('/test');
      } catch (error) {
        // Expected to throw after all retries
      }

      // Initial attempt + 2 retries = 3 total
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should succeed on retry if request eventually succeeds', async () => {
      let attemptCount = 0;
      global.fetch = vi.fn(() => {
        attemptCount++;
        if (attemptCount < 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ok: true, data: 'success' }),
        });
      });

      const result = await apiClient.get('/test');
      expect(result.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should show network error toast after all retries fail', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      try {
        await apiClient.get('/test');
      } catch (error) {
        // Expected to throw
      }

      expect(toast.error).toHaveBeenCalledWith('Network error. Please check your connection.');
    });

    it('should not retry on 401 (authentication) errors', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          status: 401,
          ok: false,
        })
      );

      const result = await apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith('Session expired.');
      expect(result).toBeNull();
    });

    it('should clear localStorage and redirect on 401 error', async () => {
      const originalLocation = window.location.href;
      delete window.location;
      window.location = { href: originalLocation };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          status: 401,
          ok: false,
        })
      );

      await apiClient.get('/test');

      expect(localStorage.clear).toHaveBeenCalled();
      expect(window.location.href).toBe('/login');
    });
  });

  describe('Authorization Header', () => {
    it('should include authorization header when token exists', async () => {
      const mockLocalStorage = {
        getItem: vi.fn((key) => key === 'token' ? 'test-token' : null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      
      // Temporarily replace localStorage
      const originalLocalStorage = global.localStorage;
      global.localStorage = mockLocalStorage;
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ok: true }),
        })
      );

      await apiClient.get('/test');

      const callArgs = global.fetch.mock.calls[0][1];
      expect(callArgs.headers).toBeDefined();
      expect(callArgs.headers.Authorization).toBe('Bearer test-token');
      
      // Restore localStorage
      global.localStorage = originalLocalStorage;
    });

    it('should not include authorization header when no token', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ok: true }),
        })
      );

      await apiClient.get('/test');

      const callArgs = global.fetch.mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBeUndefined();
    });
  });

  describe('HTTP Method Support', () => {
    beforeEach(() => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ok: true }),
        })
      );
    });

    it('should support GET requests', async () => {
      await apiClient.get('/test');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/test',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should support POST requests with body', async () => {
      const data = { name: 'Test' };
      await apiClient.post('/test', data);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      );
    });

    it('should support PATCH requests with body', async () => {
      const data = { name: 'Updated' };
      await apiClient.patch('/test', data);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/test',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(data),
        })
      );
    });

    it('should support DELETE requests', async () => {
      await apiClient.delete('/test');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/test',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Content-Type Header', () => {
    it('should set Content-Type to application/json by default', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ok: true }),
        })
      );

      await apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should allow custom headers to override defaults', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ok: true }),
        })
      );

      await apiClient.get('/test', {
        headers: { 'Content-Type': 'text/plain' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'text/plain',
          }),
        })
      );
    });
  });

  describe('Network Error Scenarios', () => {
    it('should handle network timeout gracefully', async () => {
      global.fetch = vi.fn(() => 
        Promise.reject(new Error('NetworkError: timeout'))
      );

      try {
        await apiClient.get('/test');
      } catch (error) {
        expect(error.message).toContain('timeout');
      }

      expect(toast.error).toHaveBeenCalled();
    });

    it('should handle DNS resolution failures', async () => {
      global.fetch = vi.fn(() => 
        Promise.reject(new Error('NetworkError: Failed to fetch'))
      );

      try {
        await apiClient.get('/test');
      } catch (error) {
        expect(error.message).toContain('Failed to fetch');
      }

      expect(toast.error).toHaveBeenCalled();
    });

    it('should handle CORS errors', async () => {
      global.fetch = vi.fn(() => 
        Promise.reject(new Error('NetworkError: CORS policy'))
      );

      try {
        await apiClient.get('/test');
      } catch (error) {
        expect(error.message).toContain('CORS');
      }

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('Retry Delay', () => {
    it('should wait 1 second between retries', async () => {
      vi.useFakeTimers();
      
      let attemptCount = 0;
      global.fetch = vi.fn(() => {
        attemptCount++;
        return Promise.reject(new Error('Network error'));
      });

      const promise = apiClient.get('/test').catch(() => {});

      // First attempt
      await vi.advanceTimersByTimeAsync(0);
      expect(attemptCount).toBe(1);

      // Wait for retry delay
      await vi.advanceTimersByTimeAsync(1000);
      expect(attemptCount).toBe(2);

      // Wait for second retry delay
      await vi.advanceTimersByTimeAsync(1000);
      expect(attemptCount).toBe(3);

      await promise;

      vi.useRealTimers();
    });
  });
});
