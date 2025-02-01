from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.base import BaseSchema, BaseResponseSchema

class TestStep(BaseModel):
    action: str
    xpath: str
    args: Optional[Dict[str, Any]] = None
    description: Optional[str] = None

class TestResult(BaseModel):
    selector: str
    expected_value: Any
    comparison_type: str = "equals"  # equals, contains, regex, etc.

class TestCaseBase(BaseModel):
    name: str
    description: Optional[str] = None
    priority: int = Field(default=1, ge=1, le=3)
    steps: List[TestStep] = []
    expected_results: Optional[List[TestResult]] = None
    screenshot_timing: str = "on-failure"
    is_enabled: bool = True
    dependencies: Optional[List[int]] = None
    before_each: Optional[List[TestStep]] = None
    after_each: Optional[List[TestStep]] = None

class TestCaseCreate(TestCaseBase):
    test_suite_id: int

class TestCaseUpdate(TestCaseBase):
    pass

class TestCase(TestCaseBase):
    id: int
    test_suite_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TestCaseResponse(TestCaseBase, BaseResponseSchema):
    test_suite_id: int
