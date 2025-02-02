import { ApiError, ApiResponse } from "@/types";

export async function handleApiResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
            error: "不明なエラーが発生しました",
        }));
        throw new Error(errorData.error || `${response.status} エラーが発生しました`);
    }

    return response.json();
}

export function createErrorResponse(error: Error | unknown, status = 500): Response {
    console.error("APIエラー:", error);
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました";
    return new Response(JSON.stringify({
        error: message,
        status,
        timestamp: new Date().toISOString()
    }), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
        },
    });
}

export function createSuccessResponse<T>(data: T, status = 200): Response {
    return new Response(JSON.stringify({
        data,
        status,
        timestamp: new Date().toISOString()
    }), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
        },
    });
}

export function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === "object" &&
        error !== null &&
        "error" in error &&
        typeof (error as ApiError).error === "string"
    );
} 