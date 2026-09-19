import React from 'react';
import { DocumentStatus } from '../../types/index.js';
import { cn } from '../../lib/utils.js';

interface StatusBadgeProps {
  status: DocumentStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className,
  showIcon = true,
}) => {
  const config: Record<
    DocumentStatus,
    {
      label: string;
      dot: string;
      bg: string;
      text: string;
      border: string;
    }
  > = {
    PENDING: {
      label: 'Pending',
      dot: 'bg-slate-400',
      bg: 'bg-slate-100/80',
      text: 'text-slate-600',
      border: 'border-slate-200',
    },
    UPLOADED: {
      label: 'Uploaded',
      dot: 'bg-blue-500',
      bg: 'bg-blue-50/60',
      text: 'text-blue-700',
      border: 'border-blue-200/70',
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      dot: 'bg-amber-500',
      bg: 'bg-amber-50/60',
      text: 'text-amber-800',
      border: 'border-amber-200/70',
    },
    CORRECTION_REQUIRED: {
      label: 'Correction Required',
      dot: 'bg-rose-500',
      bg: 'bg-rose-50/60',
      text: 'text-rose-700',
      border: 'border-rose-200/70',
    },
    APPROVED: {
      label: 'Approved',
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50/60',
      text: 'text-emerald-700',
      border: 'border-emerald-200/70',
    },
  };

  const current = config[status] || {
    label: status,
    dot: 'bg-slate-400',
    bg: 'bg-slate-100/80',
    text: 'text-slate-600',
    border: 'border-slate-200',
  };

  const sizeClasses = {
    sm: 'text-[11px] py-0.5 px-2 gap-1.5',
    md: 'text-xs py-1 px-2.5 gap-1.5',
    lg: 'text-xs py-1.5 px-3 gap-2',
  }[size];

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-colors select-none',
        current.bg,
        current.text,
        current.border,
        sizeClasses,
        className
      )}
    >
      {showIcon && (
        <span className={cn('rounded-full shrink-0', current.dot, dotSizes)} />
      )}
      <span>{current.label}</span>
    </span>
  );
};
