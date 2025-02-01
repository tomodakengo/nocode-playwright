from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from datetime import datetime
from app.models.code_generator import CodeType

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

class CodeGeneratorBase(BaseModel):
    name: str
    code_type: CodeType
    source_id: int
    metadata: Optional[Dict[str, Any]] = None

class CodeGeneratorCreate(CodeGeneratorBase):
    project_id: int

class CodeGeneratorUpdate(CodeGeneratorBase):
    pass

class GeneratedCode(CodeGeneratorBase):
    id: int
    project_id: int
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PageObjectTemplate(BaseModel):
    class_name: str
    url_pattern: str
    selectors: Dict[str, Dict[str, str]]
    wait_conditions: Optional[Dict[str, Dict[str, Any]]] = None
    iframe_selector: Optional[str] = None

class TestCaseTemplate(BaseModel):
    class_name: str
    description: Optional[str] = None
    test_data: Optional[Dict[str, Any]] = None
    before_each: Optional[list] = None
    after_each: Optional[list] = None
    steps: list
    expected_results: Optional[list] = None

class ConfigTemplate(BaseModel):
    project_name: str
    browser_type: str = "chromium"
    viewport: Dict[str, int] = {"width": 1280, "height": 720}
    base_url: Optional[str] = None
    timeout: int = 30000
    screenshot_dir: str = "./screenshots"
    video_dir: Optional[str] = "./videos"
    retry_count: int = 2
