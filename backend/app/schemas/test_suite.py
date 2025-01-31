from typing import Optional, Dict, List
from app.schemas.base import BaseSchema, BaseResponseSchema

class TestSuiteBase(BaseSchema):
    name: str
    description: Optional[str] = None
    configuration: Dict = {}

class TestSuiteCreate(TestSuiteBase):
    pass

class TestSuiteUpdate(TestSuiteBase):
    name: Optional[str] = None

class TestSuiteResponse(TestSuiteBase, BaseResponseSchema):
    pass

class TestSuiteWithTestCases(TestSuiteResponse):
    test_cases: List["TestCaseResponse"] = []
