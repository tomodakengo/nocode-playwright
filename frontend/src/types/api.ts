import { z } from 'zod';

// Project
export const ProjectSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;

// Test Suite
export const TestSuiteSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    type: z.enum(['smoke', 'regression', 'integration', 'e2e']),
    project_id: z.number(),
    browser_type: z.string(),
    device_settings: z.string().nullable(),
    parallel_execution: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type TestSuite = z.infer<typeof TestSuiteSchema>;

// Test Case
export const TestStepSchema = z.object({
    action: z.string(),
    xpath: z.string(),
    args: z.record(z.any()).nullable(),
    description: z.string().nullable(),
});

export const TestResultSchema = z.object({
    selector: z.string(),
    expected_value: z.any(),
    comparison_type: z.string(),
});

export const TestCaseSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    test_suite_id: z.number(),
    priority: z.number(),
    steps: z.array(TestStepSchema),
    expected_results: z.array(TestResultSchema).nullable(),
    screenshot_timing: z.string(),
    is_enabled: z.boolean(),
    dependencies: z.array(z.number()).nullable(),
    before_each: z.array(TestStepSchema).nullable(),
    after_each: z.array(TestStepSchema).nullable(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type TestCase = z.infer<typeof TestCaseSchema>;

// Test Execution
export const ExecutionStatusSchema = z.enum([
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled',
]);

export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

export const TestExecutionSchema = z.object({
    id: z.number(),
    project_id: z.number(),
    test_suite_id: z.number().nullable(),
    status: ExecutionStatusSchema,
    browser_type: z.string(),
    environment: z.record(z.any()).nullable(),
    start_time: z.string().nullable(),
    end_time: z.string().nullable(),
    results: z.record(z.any()).nullable(),
    error_message: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type TestExecution = z.infer<typeof TestExecutionSchema>;

// Test Result
export const TestResultDetailSchema = z.object({
    id: z.number(),
    execution_id: z.number(),
    test_case_id: z.number(),
    status: z.string(),
    duration: z.number().nullable(),
    error_message: z.string().nullable(),
    screenshot_path: z.string().nullable(),
    video_path: z.string().nullable(),
    logs: z.record(z.any()).nullable(),
    created_at: z.string(),
});

export type TestResultDetail = z.infer<typeof TestResultDetailSchema>;

// Statistics
export const TestExecutionStatisticsSchema = z.object({
    total_executions: z.number(),
    passed_count: z.number(),
    failed_count: z.number(),
    average_duration: z.number(),
    success_rate: z.number(),
});

export type TestExecutionStatistics = z.infer<typeof TestExecutionStatisticsSchema>; 