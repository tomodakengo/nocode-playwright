export interface TestStep {
    id: number;
    test_case_id: number;
    action_type_id: number;
    selector_id: number | null;
    input_value: string;
    assertion_value: string;
    description: string;
    order_index: number;
}

export interface ActionType {
    id: number;
    name: string;
    description: string;
    has_value: boolean;
    has_selector: boolean;
    has_assertion: boolean;
}

export interface Selector {
    id: number;
    name: string;
    selector_type: string;
    selector_value: string;
}

export interface ApiError {
    error: string;
    status?: number;
}

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: number;
}

export interface ValidationError {
    field: string;
    message: string;
} 