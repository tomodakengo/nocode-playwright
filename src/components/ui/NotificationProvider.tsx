'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NotificationState } from '@/types';
import { generateId } from '@/lib/utils';
import { NOTIFICATION_DURATIONS } from '@/lib/constants';

interface NotificationContextType {
  notifications: NotificationState[];
  showNotification: (notification: Omit<NotificationState, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const showNotification = useCallback((notification: Omit<NotificationState, 'id'>) => {
    const id = generateId();
    const newNotification: NotificationState = {
      ...notification,
      id,
      duration: notification.duration ?? NOTIFICATION_DURATIONS[notification.type]
    };

    setNotifications(prev => [...prev, newNotification]);

    // 自動削除
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        removeNotification,
        clearAllNotifications
      }}
    >
      {children}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </NotificationContext.Provider>
  );
}

interface NotificationContainerProps {
  notifications: NotificationState[];
  onRemove: (id: string) => void;
}

function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-50 space-y-2 max-w-sm"
      role="region"
      aria-label="通知一覧"
    >
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: NotificationState;
  onRemove: (id: string) => void;
}

function NotificationItem({ notification, onRemove }: NotificationItemProps) {
  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconMap = {
    success: '✅',
    error: '❌', 
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div
      className={`p-4 rounded-lg border shadow-lg transition-all duration-300 ${typeClasses[notification.type]}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="text-lg" aria-hidden="true">
          {iconMap[notification.type]}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
          aria-label="通知を閉じる"
        >
          ✕
        </button>
      </div>
    </div>
  );
}