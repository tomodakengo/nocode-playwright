import { ACTION_ICONS, STATUS_COLORS } from './constants';

export function getActionIcon(actionName: string): string {
  return ACTION_ICONS[actionName] ?? ACTION_ICONS.default;
}

export function getStatusColor(status?: string): string {
  if (!status || !(status in STATUS_COLORS)) {
    return STATUS_COLORS.pending;
  }
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS];
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  const remainingMs = milliseconds % 1000;
  
  if (seconds < 60) {
    return `${seconds}.${Math.floor(remainingMs / 10)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}m ${remainingSeconds}s`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}

export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // フォールバック
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    return new Promise((resolve, reject) => {
      if (document.execCommand('copy')) {
        resolve();
      } else {
        reject(new Error('コピーに失敗しました'));
      }
      textArea.remove();
    });
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  return fn().catch(async (error) => {
    if (maxRetries <= 0) {
      throw error;
    }
    
    await sleep(delay);
    return retry(fn, maxRetries - 1, delay * 2);
  });
}