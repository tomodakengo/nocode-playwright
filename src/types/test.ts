export interface TestStep {
  id: number;
  test_case_id: number;
  action_type_id: number;
  selector_id: number | null;
  input_value: string;
  assertion_value: string;
  description: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface TestCase {
  id: number;
  test_suite_id: number;
  name: string;
  description: string;
  is_enabled: boolean;
  order_index: number;
  steps?: TestStep[];
  created_at?: string;
  updated_at?: string;
}

export interface TestSuite {
  id: number;
  name: string;
  description: string;
  is_enabled: boolean;
  test_cases?: TestCase[];
  created_at?: string;
  updated_at?: string;
}

export interface ActionType {
  id: number;
  name: string;
  description: string;
  has_value: boolean;
  has_selector: boolean;
  has_assertion: boolean;
  category?: string;
  icon?: string;
}

export interface Selector {
  id: number;
  name: string;
  selector_type: 'xpath' | 'css' | 'id' | 'class' | 'text';
  selector_value: string;
  page_url?: string;
  description?: string;
  is_dynamic?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type TestStepWithDetails = TestStep & {
  actionTypeName?: string;
  selectorName?: string;
  actionDescription?: string;
};