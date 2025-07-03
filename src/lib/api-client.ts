import { ApiResponse, ApiError } from '@/types';

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: ApiError = {
        error: errorData.error || response.statusText,
        status: response.status,
        details: errorData
      };
      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as any;
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.defaultHeaders,
      ...options
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const requestInit: RequestInit = {
      method: 'POST',
      headers: this.defaultHeaders,
      ...options
    };
    
    if (data) {
      requestInit.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, requestInit);
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const requestInit: RequestInit = {
      method: 'PUT',
      headers: this.defaultHeaders,
      ...options
    };
    
    if (data) {
      requestInit.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, requestInit);
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.defaultHeaders,
      ...options
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const requestInit: RequestInit = {
      method: 'PATCH',
      headers: this.defaultHeaders,
      ...options
    };
    
    if (data) {
      requestInit.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, requestInit);
    return this.handleResponse<T>(response);
  }

  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }
}

export const apiClient = new ApiClient();

// 便利なヘルパー関数
export async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  errorMessage: string = 'API呼び出しに失敗しました'
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    
    if (error && typeof error === 'object' && 'error' in error) {
      throw new Error((error as ApiError).error);
    }
    
    throw new Error(errorMessage);
  }
}