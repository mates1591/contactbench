'use client';

import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  className?: string;
  actionButton?: ReactNode;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  description, 
  className = "",
  actionButton
}: StatsCardProps) {
  return (
    <div className={`bg-white dark:bg-neutral-dark rounded-xl shadow p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {value}
            </h3>
          </div>
          {description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
          {actionButton && (
            <div className="mt-4">
              {actionButton}
            </div>
          )}
        </div>
        <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
} 