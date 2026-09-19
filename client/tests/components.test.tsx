import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBadge } from '../src/components/common/StatusBadge.js';
import { Modal } from '../src/components/common/Modal.js';
import { formatFileSize, formatDuration } from '../src/lib/utils.js';

describe('UI Primitives & Formatters', () => {
  it('renders all document status states correctly', () => {
    const { rerender } = render(<StatusBadge status="PENDING" />);
    expect(screen.getByText(/Pending/i)).toBeInTheDocument();

    rerender(<StatusBadge status="UPLOADED" />);
    expect(screen.getByText(/Uploaded/i)).toBeInTheDocument();

    rerender(<StatusBadge status="UNDER_REVIEW" />);
    expect(screen.getByText(/Under Review/i)).toBeInTheDocument();

    rerender(<StatusBadge status="CORRECTION_REQUIRED" />);
    expect(screen.getByText(/Correction Required/i)).toBeInTheDocument();

    rerender(<StatusBadge status="APPROVED" />);
    expect(screen.getByText(/Approved/i)).toBeInTheDocument();
  });

  it('formats file sizes accurately', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(5242880)).toBe('5 MB');
  });

  it('formats waiting durations accurately', () => {
    expect(formatDuration(30000)).toBe('Just now');
    expect(formatDuration(120000)).toBe('2m');
    expect(formatDuration(3600000)).toBe('1h 0m');
    expect(formatDuration(7500000)).toBe('2h 5m');
  });

  it('renders modal and handles close trigger', () => {
    const handleClose = vi.fn();
    const { unmount } = render(
      <Modal isOpen={true} onClose={handleClose} title="Upload Verification">
        <div>Modal Content Body</div>
      </Modal>
    );

    expect(screen.getByText('Upload Verification')).toBeInTheDocument();
    expect(screen.getByText('Modal Content Body')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
    unmount();
  });
});
