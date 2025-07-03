'use client';

import React from 'react';
import { classNames } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'white' | 'gray';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

const colorClasses = {
  blue: 'border-blue-600',
  white: 'border-white',
  gray: 'border-gray-600'
};

export function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  className = '',
  label = '読み込み中'
}: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center" role="status" aria-label={label}>
      <div
        className={classNames(
          'animate-spin rounded-full border-b-2',
          sizeClasses[size],
          colorClasses[color],
          className
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}