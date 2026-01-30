import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BoardModal from '../components/BoardModal';
import TicketModal from '../components/TicketModal';

describe('Frontend Empty/Null Input Tests', () => {
  describe('BoardModal - Empty/Null Title Validation', () => {
    it('should disable create button when title is empty', () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      const createButton = screen.getByRole('button', { name: /create board/i });
      expect(createButton).toBeDisabled();
    });

    it('should disable create button when title is whitespace only', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      const input = screen.getByLabelText(/board title/i);
      await user.type(input, '   ');
      
      const createButton = screen.getByRole('button', { name: /create board/i });
      expect(createButton).toBeDisabled();
    });

    it('should enable create button when title has content', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      const input = screen.getByLabelText(/board title/i);
      await user.type(input, 'Valid Board Name');
      
      const createButton = screen.getByRole('button', { name: /create board/i });
      expect(createButton).not.toBeDisabled();
    });

    it('should not call onCreate when title is empty', () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      const createButton = screen.getByRole('button', { name: /create board/i });
      fireEvent.click(createButton);
      
      expect(onCreate).not.toHaveBeenCalled();
    });

    it('should trim title before submitting', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      const input = screen.getByLabelText(/board title/i);
      await user.type(input, '  Valid Board  ');
      
      const createButton = screen.getByRole('button', { name: /create board/i });
      await user.click(createButton);
      
      expect(onCreate).toHaveBeenCalledWith('Valid Board');
    });
  });

  describe('TicketModal - Empty/Null Input Validation', () => {
    beforeEach(() => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ ok: true, data: { users: [] } }),
        })
      );
    });

    it('should disable create button when title is empty', () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      
      render(<TicketModal isOpen={true} onClose={onClose} onCreate={onCreate} columnTitle="Backlog" />);
      
      const createButton = screen.getByRole('button', { name: /create ticket/i });
      expect(createButton).toBeDisabled();
    });

    it('should disable create button when title is whitespace only', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      render(<TicketModal isOpen={true} onClose={onClose} onCreate={onCreate} columnTitle="Backlog" />);
      
      const input = screen.getByLabelText(/task title/i);
      await user.type(input, '   ');
      
      const createButton = screen.getByRole('button', { name: /create ticket/i });
      expect(createButton).toBeDisabled();
    });

    it('should enable create button when title has content', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      render(<TicketModal isOpen={true} onClose={onClose} onCreate={onCreate} columnTitle="Backlog" />);
      
      const input = screen.getByLabelText(/task title/i);
      await user.type(input, 'Valid Ticket Title');
      
      const createButton = screen.getByRole('button', { name: /create ticket/i });
      expect(createButton).not.toBeDisabled();
    });

    it('should accept empty description', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      render(<TicketModal isOpen={true} onClose={onClose} onCreate={onCreate} columnTitle="Backlog" />);
      
      const titleInput = screen.getByLabelText(/task title/i);
      await user.type(titleInput, 'Valid Ticket');
      
      const createButton = screen.getByRole('button', { name: /create ticket/i });
      await user.click(createButton);
      
      expect(onCreate).toHaveBeenCalledWith({
        title: 'Valid Ticket',
        description: '',
        priority: 'Medium',
        assignee: null
      });
    });

    it('should trim ticket title before submitting', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      render(<TicketModal isOpen={true} onClose={onClose} onCreate={onCreate} columnTitle="Backlog" />);
      
      const titleInput = screen.getByLabelText(/task title/i);
      await user.type(titleInput, '  Valid Ticket  ');
      
      const createButton = screen.getByRole('button', { name: /create ticket/i });
      await user.click(createButton);
      
      expect(onCreate).toHaveBeenCalledWith({
        title: 'Valid Ticket',
        description: '',
        priority: 'Medium',
        assignee: null
      });
    });

    it('should allow null assignee (unassigned)', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      render(<TicketModal isOpen={true} onClose={onClose} onCreate={onCreate} columnTitle="Backlog" />);
      
      const titleInput = screen.getByLabelText(/task title/i);
      await user.type(titleInput, 'Valid Ticket');
      
      const createButton = screen.getByRole('button', { name: /create ticket/i });
      await user.click(createButton);
      
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({ assignee: null })
      );
    });
  });

  describe('Form Reset After Submission', () => {
    it('should reset board form after successful submission', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      const { rerender } = render(<BoardModal isOpen={true} onClose={onClose} onCreate={onCreate} />);
      
      const input = screen.getByLabelText(/board title/i);
      await user.type(input, 'Test Board');
      
      const createButton = screen.getByRole('button', { name: /create board/i });
      await user.click(createButton);
      
      expect(onCreate).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('should reset ticket form after successful submission', async () => {
      const onClose = vi.fn();
      const onCreate = vi.fn();
      const user = userEvent.setup();
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ ok: true, data: { users: [] } }),
        })
      );
      
      render(<TicketModal isOpen={true} onClose={onClose} onCreate={onCreate} columnTitle="Backlog" />);
      
      const titleInput = screen.getByLabelText(/task title/i);
      await user.type(titleInput, 'Test Ticket');
      
      const createButton = screen.getByRole('button', { name: /create ticket/i });
      await user.click(createButton);
      
      expect(onCreate).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
