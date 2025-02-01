import axios from 'axios';
import type {
    Project,
    TestSuite,
    TestCase,
    TestExecution,
    TestResultDetail,
    TestExecutionStatistics,
} from '../types/api';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Projects
export const getProjects = async () => {
    const response = await api.get<Project[]>('/api/projects');
    return response.data;
};

export const getProject = async (id: number) => {
    const response = await api.get<Project>(`/api/projects/${id}`);
    return response.data;
};

export const createProject = async (data: {
    name: string;
    description: string;
}) => {
    const response = await api.post<Project>('/api/projects', data);
    return response.data;
};

export const updateProject = async (id: number, data: { name: string; description: string }) => {
    const response = await api.put<Project>(`/api/projects/${id}`, data);
    return response.data;
};

export const deleteProject = async (id: number) => {
    await api.delete(`/api/projects/${id}`);
};

// Test Suites
export const getTestSuites = async (projectId: number) => {
    const response = await api.get<TestSuite[]>(`/projects/${projectId}/test-suites/`);
    return response.data;
};

export const getTestSuite = async (id: number) => {
    const response = await api.get<TestSuite>(`/test-suites/${id}`);
    return response.data;
};

export const createTestSuite = async (projectId: number, data: Omit<TestSuite, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post<TestSuite>(`/projects/${projectId}/test-suites/`, data);
    return response.data;
};

export const updateTestSuite = async (id: number, data: Partial<TestSuite>) => {
    const response = await api.put<TestSuite>(`/test-suites/${id}`, data);
    return response.data;
};

export const deleteTestSuite = async (id: number) => {
    const response = await api.delete<TestSuite>(`/test-suites/${id}`);
    return response.data;
};

// Test Cases
export const getTestCases = async (testSuiteId: number) => {
    const response = await api.get<TestCase[]>(`/test-suites/${testSuiteId}/test-cases/`);
    return response.data;
};

export const getTestCase = async (id: number) => {
    const response = await api.get<TestCase>(`/test-cases/${id}`);
    return response.data;
};

export const createTestCase = async (testSuiteId: number, data: Omit<TestCase, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post<TestCase>(`/test-suites/${testSuiteId}/test-cases/`, data);
    return response.data;
};

export const updateTestCase = async (id: number, data: Partial<TestCase>) => {
    const response = await api.put<TestCase>(`/test-cases/${id}`, data);
    return response.data;
};

export const deleteTestCase = async (id: number) => {
    const response = await api.delete<TestCase>(`/test-cases/${id}`);
    return response.data;
};

// Test Executions
export const getTestExecutions = async (projectId: number) => {
    const response = await api.get<TestExecution[]>(`/projects/${projectId}/executions/`);
    return response.data;
};

export const getTestExecution = async (id: number) => {
    const response = await api.get<TestExecution>(`/executions/${id}`);
    return response.data;
};

export const createTestExecution = async (projectId: number, data: { test_suite_id?: number; browser_type: string }) => {
    const response = await api.post<TestExecution>(`/projects/${projectId}/executions/`, data);
    return response.data;
};

export const cancelTestExecution = async (id: number) => {
    const response = await api.post<TestExecution>(`/executions/${id}/cancel`);
    return response.data;
};

export const getTestResults = async (executionId: number) => {
    const response = await api.get<TestResultDetail[]>(`/executions/${executionId}/results`);
    return response.data;
};

export const getProjectStatistics = async (projectId: number, testSuiteId?: number) => {
    const params = testSuiteId ? { test_suite_id: testSuiteId } : undefined;
    const response = await api.get<TestExecutionStatistics>(`/projects/${projectId}/statistics`, { params });
    return response.data;
}; 