import { TestStep, ValidationError } from "@/types";

export function validateTestStep(step: Partial<TestStep>): ValidationError[] {
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
