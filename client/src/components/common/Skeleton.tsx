import React from 'react';
import { cn } from '../../lib/utils.js';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/60', className)}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-xs space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <Skeleton className="h-7 w-20" />
    <div className="pt-3 border-t border-slate-100 flex justify-between">
      <Skeleton className="h-3 w-28" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white rounded-xl border border-slate-200/70 overflow-hidden shadow-xs">
    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-3 w-1/4" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <div className="space-y-1.5 w-1/3">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      ))}
    </div>
  </div>
);
