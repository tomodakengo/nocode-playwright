import { TestStep, ValidationError, ActionType, Selector } from "@/types";

export function validateTestStep(step: Partial<TestStep>, actionType?: ActionType): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!step.action_type_id) {
        errors.push({
            field: "action_type_id",
            message: "アクションタイプは必須です",
        });
    }

    if (step.order_index === undefined || step.order_index < 1) {
        errors.push({
            field: "order_index",
            message: "順序は1以上の数値である必要があります",
        });
    }

    if (actionType) {
        if (actionType.has_selector && !step.selector_id) {
            errors.push({
                field: "selector_id",
                message: "このアクションタイプにはセレクタの指定が必要です",
            });
        }

        if (actionType.has_value && !step.input_value) {
            errors.push({
                field: "input_value",
                message: "このアクションタイプには入力値の指定が必要です",
            });
        }

        if (actionType.has_assertion && !step.assertion_value) {
            errors.push({
                field: "assertion_value",
                message: "このアクションタイプにはアサーション値の指定が必要です",
            });
        }
    }

    return errors;
}

export function validateSelector(selector: Partial<Selector>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!selector.name) {
        errors.push({
            field: "name",
            message: "セレクタ名は必須です",
        });
    }

    if (!selector.selector_type) {
        errors.push({
            field: "selector_type",
            message: "セレクタタイプは必須です",
        });
    } else if (!["xpath", "css"].includes(selector.selector_type.toLowerCase())) {
        errors.push({
            field: "selector_type",
            message: "セレクタタイプはXPathまたはCSSのいずれかを指定してください",
        });
    }

    if (!selector.selector_value) {
        errors.push({
            field: "selector_value",
            message: "セレクタ値は必須です",
        });
    }

    return errors;
}

export function formatValidationErrors(errors: ValidationError[]): string {
    return errors.map((error) => error.message).join("、");
}

export function ensureNumber(value: string | number | undefined | null): number | null {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
}

export function ensureString(value: string | null | undefined): string {
    return value || "";
}

export function validateUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
