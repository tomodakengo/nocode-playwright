export interface Theme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface NotificationState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  id: string;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: any;
  onClose?: () => void;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  options?: Array<{ value: string | number; label: string }>;
  validation?: (value: any) => string | null;
}

export interface StepFormData {
  action_type_id: number;
  selector_id: number | null;
  input_value: string;
  assertion_value: string;
  description: string;
}

export interface DragDropItem {
  id: string | number;
  type: string;
  content: any;
}