export const ACTION_ICONS: Record<string, string> = {
  click: '👆',
  type: '⌨️',
  fill: '📝',
  navigate: '🌐',
  wait: '⏱️',
  assert_visible: '👁️',
  assert_text: '📄',
  hover: '🖱️',
  screenshot: '📸',
  scroll_into_view: '📜',
  press: '⚡',
  check: '✅',
  uncheck: '❌',
  select_option: '📋',
  default: '🔧'
};

export const STATUS_COLORS = {
  passed: 'bg-green-100 border-green-500 text-green-800',
  failed: 'bg-red-100 border-red-500 text-red-800',
  skipped: 'bg-gray-100 border-gray-400 text-gray-600',
  running: 'bg-yellow-100 border-yellow-500 text-yellow-800',
  pending: 'bg-blue-50 border-blue-200 text-blue-800'
} as const;

export const NOTIFICATION_DURATIONS = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000
} as const;

export const API_ENDPOINTS = {
  TEST_SUITES: '/api/test-suites',
  ACTION_TYPES: '/api/action-types',
  SELECTORS: '/api/selectors',
  TEST_CASES: '/api/test-cases',
  EXECUTE: '/api/test-cases/{id}/execute'
} as const;

export const DEFAULT_EXECUTION_OPTIONS = {
  headless: true,
  timeout: 30000,
  browser: 'chromium' as const,
  viewport: { width: 1280, height: 720 }
};

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'この項目は必須です',
  INVALID_URL: '有効なURLを入力してください',
  INVALID_NUMBER: '有効な数値を入力してください',
  DUPLICATE_NAME: 'この名前は既に使用されています'
} as const;