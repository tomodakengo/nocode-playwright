export interface ApiError {
  error: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ExecutionResult {
  id: string;
  status: 'passed' | 'failed' | 'error';
  duration: number;
  timestamp: string;
  steps: StepExecutionResult[];
  error?: string;
  screenshots?: string[];
}

export interface StepExecutionResult {
  step_id: number;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}