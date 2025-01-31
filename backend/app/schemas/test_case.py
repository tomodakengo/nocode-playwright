from typing import Optional, List, Dict
from app.schemas.base import BaseSchema, BaseResponseSchema

class TestCaseBase(BaseSchema):
    name: str
    description: Optional[str] = None
    steps: List[Dict] = []
    before_each: Optional[Dict] = None
    after_each: Optional[Dict] = None

class TestCaseCreate(TestCaseBase):
    test_suite_id: int

class TestCaseUpdate(TestCaseBase):
    name: Optional[str] = None
    test_suite_id: Optional[int] = None

class TestCaseResponse(TestCaseBase, BaseResponseSchema):
    test_suite_id: int
