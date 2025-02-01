from typing import Dict, List, Optional
from pydantic import BaseModel

class GeneratePageObjectRequest(BaseModel):
    name: str
    url_pattern: str
    selectors: List[Dict[str, str]]

class GenerateTestFileRequest(BaseModel):
    name: str
    steps: List[Dict[str, str]]

class GeneratedCodeResponse(BaseModel):
    code: str
    file_path: Optional[str] = None

class TestStep(BaseModel):
    action: str
    selector: Optional[str] = None
    value: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    assertion: Optional[str] = None

class TestCaseSchema(BaseModel):
    name: str
    description: Optional[str] = None
    steps: List[TestStep]

class TestSuiteSchema(BaseModel):
    name: str
    description: Optional[str] = None
    test_cases: List[TestCaseSchema]
