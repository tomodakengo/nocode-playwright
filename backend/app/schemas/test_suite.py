from datetime import datetime
from typing import Optional, Dict, List
from pydantic import BaseModel, Field
from app.models.test_suite import TestSuiteType
from app.schemas.base import BaseSchema, BaseResponseSchema

class TestSuiteBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: TestSuiteType = TestSuiteType.E2E
    browser_type: str = "chromium"
    device_settings: Optional[str] = None
    parallel_execution: int = Field(default=1, ge=1)

class TestSuiteCreate(TestSuiteBase):
    project_id: int

class TestSuiteUpdate(TestSuiteBase):
    pass

class TestSuite(TestSuiteBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TestSuiteResponse(TestSuiteBase, BaseResponseSchema):
    pass

class TestSuiteWithTestCases(TestSuiteResponse):
    test_cases: List["TestCaseResponse"] = []
