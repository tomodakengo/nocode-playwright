from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from app.models.test_execution import ExecutionStatus

class TestResultBase(BaseModel):
    test_case_id: int
    status: str
    duration: Optional[int] = None
    error_message: Optional[str] = None
    screenshot_path: Optional[str] = None
    video_path: Optional[str] = None
    logs: Optional[Dict[str, Any]] = None

class TestResultCreate(TestResultBase):
    execution_id: int

class TestResult(TestResultBase):
    id: int
    execution_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TestExecutionBase(BaseModel):
    project_id: int
    test_suite_id: Optional[int] = None
    browser_type: str = "chromium"
    environment: Optional[Dict[str, Any]] = None

class TestExecutionCreate(TestExecutionBase):
    pass

class TestExecutionUpdate(BaseModel):
    status: ExecutionStatus
    error_message: Optional[str] = None
    results: Optional[Dict[str, Any]] = None
    end_time: Optional[datetime] = None

class TestExecution(TestExecutionBase):
    id: int
    status: ExecutionStatus
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    results: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TestExecutionWithResults(TestExecution):
    test_results: List[TestResult] = []

class TestExecutionFilter(BaseModel):
    project_id: Optional[int] = None
    test_suite_id: Optional[int] = None
    status: Optional[ExecutionStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class TestExecutionStatistics(BaseModel):
    total_executions: int
    passed_count: int
    failed_count: int
    average_duration: float
    success_rate: float 