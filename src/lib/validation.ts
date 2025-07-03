import { TestStep, ValidationError, ActionType, Selector } from "@/types";
import { VALIDATION_MESSAGES } from "./constants";

export function validateTestStep(step: Partial<TestStep>, actionType?: ActionType): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!step.action_type_id) {
        errors.push({
            field: "action_type_id",
            message: VALIDATION_MESSAGES.REQUIRED_FIELD,
            code: "REQUIRED_ACTION_TYPE"
        });
    }

    if (step.order_index === undefined || step.order_index < 1) {
        errors.push({
            field: "order_index",
            message: "順序は1以上の数値である必要があります",
            code: "INVALID_ORDER"
        });
    }

    if (actionType) {
        if (actionType.has_selector && !step.selector_id) {
            errors.push({
                field: "selector_id",
                message: "このアクションタイプにはセレクタの指定が必要です",
                code: "REQUIRED_SELECTOR"
            });
        }

        if (actionType.has_value && !step.input_value) {
            errors.push({
                field: "input_value",
                message: "このアクションタイプには入力値の指定が必要です",
                code: "REQUIRED_INPUT_VALUE"
            });
        }

        if (actionType.has_assertion && !step.assertion_value) {
            errors.push({
                field: "assertion_value",
                message: "このアクションタイプにはアサーション値の指定が必要です",
                code: "REQUIRED_ASSERTION_VALUE"
            });
        }
    }

    // 文字列長の検証
    if (step.description && step.description.length > 500) {
        errors.push({
            field: "description",
            message: "説明は500文字以内で入力してください",
            code: "DESCRIPTION_TOO_LONG"
        });
    }

    if (step.input_value && step.input_value.length > 1000) {
        errors.push({
            field: "input_value",
            message: "入力値は1000文字以内で入力してください",
            code: "INPUT_VALUE_TOO_LONG"
        });
    }

    return errors;
}

export function validateSelector(selector: Partial<Selector>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!selector.name || selector.name.trim().length === 0) {
        errors.push({
            field: "name",
            message: VALIDATION_MESSAGES.REQUIRED_FIELD,
            code: "REQUIRED_NAME"
        });
    }

    if (selector.name && selector.name.length > 100) {
        errors.push({
            field: "name",
            message: "セレクタ名は100文字以内で入力してください",
            code: "NAME_TOO_LONG"
        });
    }

    if (!selector.selector_type) {
        errors.push({
            field: "selector_type",
            message: VALIDATION_MESSAGES.REQUIRED_FIELD,
            code: "REQUIRED_SELECTOR_TYPE"
        });
    } else if (!["xpath", "css", "id", "class", "text"].includes(selector.selector_type.toLowerCase())) {
        errors.push({
            field: "selector_type",
            message: "セレクタタイプはXPath、CSS、ID、Class、Textのいずれかを指定してください",
            code: "INVALID_SELECTOR_TYPE"
        });
    }

    if (!selector.selector_value || selector.selector_value.trim().length === 0) {
        errors.push({
            field: "selector_value",
            message: VALIDATION_MESSAGES.REQUIRED_FIELD,
            code: "REQUIRED_SELECTOR_VALUE"
        });
    }

    if (selector.selector_value && selector.selector_value.length > 1000) {
        errors.push({
            field: "selector_value",
            message: "セレクタ値は1000文字以内で入力してください",
            code: "SELECTOR_VALUE_TOO_LONG"
        });
    }

    // セレクタ値の構文検証
    if (selector.selector_type === 'xpath' && selector.selector_value) {
        try {
            // 基本的なXPath構文チェック
            if (!selector.selector_value.match(/^(\/\/|\/|\.|\.\.)/)) {
                errors.push({
                    field: "selector_value",
                    message: "XPathの構文が正しくありません",
                    code: "INVALID_XPATH_SYNTAX"
                });
            }
        } catch (e) {
            errors.push({
                field: "selector_value",
                message: "XPathの構文が正しくありません",
                code: "INVALID_XPATH_SYNTAX"
            });
        }
    }

    if (selector.selector_type === 'css' && selector.selector_value) {
        try {
            // 基本的なCSS構文チェック
            if (selector.selector_value.includes('//') || selector.selector_value.includes('@')) {
                errors.push({
                    field: "selector_value",
                    message: "CSSセレクタの構文が正しくありません",
                    code: "INVALID_CSS_SYNTAX"
                });
            }
        } catch (e) {
            errors.push({
                field: "selector_value",
                message: "CSSセレクタの構文が正しくありません",
                code: "INVALID_CSS_SYNTAX"
            });
        }
    }

    // ページURLの検証
    if (selector.page_url && !isValidUrl(selector.page_url)) {
        errors.push({
            field: "page_url",
            message: VALIDATION_MESSAGES.INVALID_URL,
            code: "INVALID_PAGE_URL"
        });
    }

    return errors;
}

export function validateTestCase(testCase: { name?: string; description?: string }): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!testCase.name || testCase.name.trim().length === 0) {
        errors.push({
            field: "name",
            message: VALIDATION_MESSAGES.REQUIRED_FIELD,
            code: "REQUIRED_NAME"
        });
    }

    if (testCase.name && testCase.name.length > 100) {
        errors.push({
            field: "name",
            message: "テストケース名は100文字以内で入力してください",
            code: "NAME_TOO_LONG"
        });
    }

    if (testCase.description && testCase.description.length > 1000) {
        errors.push({
            field: "description",
            message: "説明は1000文字以内で入力してください",
            code: "DESCRIPTION_TOO_LONG"
        });
    }

    return errors;
}

export function validateTestSuite(testSuite: { name?: string; description?: string }): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!testSuite.name || testSuite.name.trim().length === 0) {
        errors.push({
            field: "name",
            message: VALIDATION_MESSAGES.REQUIRED_FIELD,
            code: "REQUIRED_NAME"
        });
    }

    if (testSuite.name && testSuite.name.length > 100) {
        errors.push({
            field: "name",
            message: "テストスイート名は100文字以内で入力してください",
            code: "NAME_TOO_LONG"
        });
    }

    if (testSuite.description && testSuite.description.length > 1000) {
        errors.push({
            field: "description",
            message: "説明は1000文字以内で入力してください",
            code: "DESCRIPTION_TOO_LONG"
        });
    }

    return errors;
}

export function formatValidationErrors(errors: ValidationError[]): string {
    return errors.map((error) => error.message).join("、");
}

export function getValidationErrorsByField(errors: ValidationError[]): Record<string, ValidationError[]> {
    return errors.reduce((acc, error) => {
        if (!acc[error.field]) {
            acc[error.field] = [];
        }
        acc[error.field]?.push(error);
        return acc;
    }, {} as Record<string, ValidationError[]>);
}

export function ensureNumber(value: string | number | undefined | null): number | null {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
}

export function ensureString(value: string | null | undefined): string {
    return value?.trim() || "";
}

export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function sanitizeInput(input: string): string {
    return input
        .replace(/[<>]/g, '') // HTMLタグを除去
        .replace(/javascript:/gi, '') // JavaScriptプロトコルを除去
        .trim();
}
