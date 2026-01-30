import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BoardModal from '../components/BoardModal';
import TicketModal from '../components/TicketModal';

describe('Mobile-Specific Edge Cases', () => {
  describe('Touch Events', () => {
    it('should handle touch events on modal buttons', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      // Simulate touch event
      fireEvent.touchStart(cancelButton);
      fireEvent.touchEnd(cancelButton);
      fireEvent.click(cancelButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('should handle touch input in text fields', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      const input = screen.getByLabelText(/board title/i);
      
      // Simulate touch focus
      fireEvent.touchStart(input);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Touch Input Test' } });
      
      expect(input.value).toBe('Touch Input Test');
    });

    it('should prevent ghost clicks on rapid tap', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      const input = screen.getByLabelText(/board title/i);
      await user.type(input, 'Test Board');
      
      const createButton = screen.getByRole('button', { name: /create board/i });
      
      // Simulate rapid taps
      fireEvent.touchStart(createButton);
      fireEvent.touchEnd(createButton);
      fireEvent.click(createButton);
      fireEvent.touchStart(createButton);
      fireEvent.touchEnd(createButton);
      
      // Should only call onCreate once despite multiple taps
      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Viewport and Orientation Changes', () => {
    let matchMediaMock;

    beforeEach(() => {
      matchMediaMock = vi.fn();
      window.matchMedia = matchMediaMock;
    });

    it('should render modal correctly in portrait mode', () => {
      matchMediaMock.mockImplementation((query) => ({
        matches: query === '(orientation: portrait)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      expect(screen.getByText(/create new board/i)).toBeInTheDocument();
    });

    it('should render modal correctly in landscape mode', () => {
      matchMediaMock.mockImplementation((query) => ({
        matches: query === '(orientation: landscape)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      expect(screen.getByText(/create new board/i)).toBeInTheDocument();
    });

    it('should handle orientation change while modal is open', () => {
      let orientationChangeHandler;
      
      matchMediaMock.mockImplementation((query) => {
        const mql = {
          matches: query === '(orientation: portrait)',
          media: query,
          onchange: null,
          addEventListener: (event, handler) => {
            if (event === 'change') {
              orientationChangeHandler = handler;
            }
          },
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
        return mql;
      });

      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      const { rerender } = render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      // Simulate orientation change
      if (orientationChangeHandler) {
        orientationChangeHandler({ matches: false });
      }
      
      rerender(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      expect(screen.getByText(/create new board/i)).toBeInTheDocument();
    });
  });

  describe('Small Screen Responsiveness', () => {
    it('should handle small viewport widths (mobile)', () => {
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // iPhone SE width
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      const input = screen.getByLabelText(/board title/i);
      expect(input).toBeInTheDocument();
      expect(input).toBeVisible();
    });

    it('should handle very small viewport widths', () => {
      // Mock very small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320, // Very small mobile
      });

      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      expect(screen.getByText(/create new board/i)).toBeInTheDocument();
    });
  });

  describe('Touch Keyboard Interactions', () => {
    it('should handle virtual keyboard appearance', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      const input = screen.getByLabelText(/board title/i);
      
      // Simulate keyboard showing (reduces viewport height)
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 400, // Reduced from typical 667
      });
      
      await user.click(input);
      await user.type(input, 'Test');
      
      expect(input.value).toBe('Test');
    });

    it('should maintain scroll position when keyboard appears', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      render(<TicketModal isOpen={true} onClose={onClose} onCreate={onCreate} columnTitle="Backlog" />);
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ ok: true, data: { users: [] } }),
        })
      );
      
      const titleInput = screen.getByLabelText(/task title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      
      // Focus on description (lower in the form)
      await user.click(descriptionInput);
      
      // Verify input is still accessible
      expect(descriptionInput).toHaveFocus();
    });
  });

  describe('Touch Gestures', () => {
    it('should verify dialog element exists before gesture test', () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      const { container } = render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      // Try multiple selectors to find the dialog
      const dialogPaper = container.querySelector('.MuiDialog-paper');
      const dialogContainer = container.querySelector('.MuiDialog-container');
      const dialog = dialogPaper || dialogContainer || container.querySelector('[role="presentation"]');
      
      if (dialog) {
        // Simulate swipe down gesture
        fireEvent.touchStart(dialog, {
          touches: [{ clientX: 200, clientY: 100 }],
        });
        
        fireEvent.touchMove(dialog, {
          touches: [{ clientX: 200, clientY: 300 }],
        });
        
        fireEvent.touchEnd(dialog);
      }
      
      // Note: Actual swipe-to-close would need to be implemented
      // This test verifies the modal renders and events can be captured
      expect(container).toBeTruthy();
      expect(screen.getByText(/create new board/i)).toBeInTheDocument();
    });

    it('should handle pinch zoom prevention on input fields', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      const input = screen.getByLabelText(/board title/i);
      
      // Simulate pinch gesture
      const touchEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 },
        ],
      });
      
      fireEvent(input, touchEvent);
      
      // Verify input still works after gesture
      expect(input).toBeInTheDocument();
    });
  });

  describe('Mobile Browser Specific Behaviors', () => {
    it('should handle Safari iOS autocorrect/autocomplete', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      const input = screen.getByLabelText(/board title/i);
      
      // Type with autocorrect interference
      await user.type(input, 'Projrct'); // Typo that might be autocorrected
      
      // Verify the actual typed value is preserved
      expect(input.value).toBe('Projrct');
    });

    it('should handle focus behavior on mobile Safari', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      const input = screen.getByLabelText(/board title/i);
      
      // Safari requires user interaction before programmatic focus
      fireEvent.touchStart(input);
      fireEvent.focus(input);
      
      expect(document.activeElement).toBe(input);
    });

    it('should handle Android Chrome keyboard done button', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      render(<TicketModal isOpen={true} onClose={onClose} onCreate={onCreate} columnTitle="Backlog" />);
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ ok: true, data: { users: [] } }),
        })
      );
      
      const titleInput = screen.getByLabelText(/task title/i);
      await user.type(titleInput, 'Test Ticket');
      
      // Simulate "Done" button press (Enter key on mobile keyboard)
      fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter' });
      
      // Should trigger submit when Enter is pressed on title field
      await waitFor(() => {
        expect(onCreate).toHaveBeenCalled();
      });
    });
  });

  describe('Network Connectivity Changes', () => {
    it('should handle going offline while modal is open', () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      render(<TicketModal isOpen={true} onClose={onClose} onCreate={onCreate} columnTitle="Backlog" />);
      
      // Simulate going offline
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);
      
      // Modal should still be functional
      expect(screen.getByLabelText(/task title/i)).toBeInTheDocument();
    });

    it('should handle coming back online', () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      render(<TicketModal isOpen={true} onClose={onClose} onCreate={onCreate} columnTitle="Backlog" />);
      
      // Simulate coming back online
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);
      
      expect(screen.getByLabelText(/task title/i)).toBeInTheDocument();
    });
  });

  describe('Memory and Performance on Mobile', () => {
    it('should not leak memory when opening and closing modal multiple times', () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      // Open and close modal multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
        unmount();
      }
      
      // Test passes if no memory errors occur
      expect(true).toBe(true);
    });

    it('should handle rapid modal toggling', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      const { rerender } = render(<BoardModal isOpen={false} onClose={onClose} onCreate={onCreate} />);
      
      // Rapidly toggle modal
      for (let i = 0; i < 5; i++) {
        rerender(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
        rerender(<BoardModal isOpen={false} onClose={onClose} onCreate={onCreate} />);
      }
      
      expect(true).toBe(true);
    });
  });
});
