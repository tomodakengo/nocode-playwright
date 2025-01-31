from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class GeneratePageObjectRequest(BaseModel):
    page_id: int = Field(..., description="ID of the page to generate code for")
    output_dir: Optional[str] = Field(None, description="Optional output directory for the generated code")

class GenerateTestFileRequest(BaseModel):
    test_suite_id: int = Field(..., description="ID of the test suite to generate code for")
    output_dir: Optional[str] = Field(None, description="Optional output directory for the generated code")

class GenerateProjectRequest(BaseModel):
    test_suite_ids: List[int] = Field(..., description="List of test suite IDs to include in the project")
    output_dir: str = Field(..., description="Output directory for the generated project")
    config: Dict = Field(default_factory=dict, description="Additional configuration for the project")

class GeneratedCodeResponse(BaseModel):
    file_path: str = Field(..., description="Path to the generated file")
    code_content: str = Field(..., description="Generated code content")

class GeneratedProjectResponse(BaseModel):
    project_dir: str = Field(..., description="Path to the generated project directory")
    generated_files: List[str] = Field(..., description="List of generated file paths")
    config_files: List[str] = Field(..., description="List of configuration file paths")
