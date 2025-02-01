import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    headers: {
        "Content-Type": "application/json",
    },
});

// プロジェクト関連のAPI
export interface Project {
    id: number;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateProjectData {
    name: string;
    description?: string;
}

export interface UpdateProjectData {
    name: string;
    description?: string;
}

export const getProjects = async (): Promise<Project[]> => {
    const response = await api.get("/projects/");
    return response.data;
};

export const getProject = async (id: number): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
};

export const createProject = async (data: CreateProjectData): Promise<Project> => {
    const response = await api.post("/projects/", data);
    return response.data;
};

export const updateProject = async (
    id: number,
    data: UpdateProjectData
): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
};

export const deleteProject = async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
};

// テストスイート関連のAPI
export interface TestSuite {
    id: number;
    project_id: number;
    name: string;
    description?: string;
    type: string;
    browser_type: string;
    created_at: string;
    updated_at: string;
}

export const getTestSuites = async (projectId: number): Promise<TestSuite[]> => {
    const response = await api.get(`/projects/${projectId}/test-suites/`);
    return response.data;
};

// テスト実行関連のAPI
export interface TestExecution {
    id: number;
    project_id: number;
    test_suite_id?: number;
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    browser_type: string;
    environment?: Record<string, any>;
    started_at?: string;
    completed_at?: string;
    results?: TestResult[];
    error?: string;
    screenshots?: Screenshot[];
    created_at: string;
    updated_at: string;
}

export interface TestResult {
    selector: string;
    expected_value: any;
    actual_value: any;
    passed: boolean;
}

export interface Screenshot {
    url: string;
    timestamp: string;
}

export interface CreateTestExecutionData {
    browser_type: string;
    environment?: Record<string, any>;
}

export const createTestExecution = async (
    projectId: number,
    data: CreateTestExecutionData
): Promise<TestExecution> => {
    const response = await api.post(`/projects/${projectId}/executions/`, data);
    return response.data;
};

export const getTestExecution = async (id: number): Promise<TestExecution> => {
    const response = await api.get(`/test-executions/${id}`);
    return response.data;
}; 