from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.services.code_generator import PlaywrightCodeGenerator
from app.schemas.code_generator import (
    GeneratePageObjectRequest,
    GenerateTestFileRequest,
    GenerateProjectRequest,
    GeneratedCodeResponse,
    GeneratedProjectResponse
)

router = APIRouter(prefix="/code-generator", tags=["code-generator"])

@router.post("/page-object", response_model=GeneratedCodeResponse)
def generate_page_object(request: GeneratePageObjectRequest, db: Session = Depends(get_db)):
    try:
        generator = PlaywrightCodeGenerator(db)
        return generator.generate_page_object(request.page_id, request.output_dir)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/test-file", response_model=GeneratedCodeResponse)
def generate_test_file(request: GenerateTestFileRequest, db: Session = Depends(get_db)):
    try:
        generator = PlaywrightCodeGenerator(db)
        return generator.generate_test_file(request.test_suite_id, request.output_dir)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/project", response_model=GeneratedProjectResponse)
def generate_project(request: GenerateProjectRequest, db: Session = Depends(get_db)):
    try:
        generator = PlaywrightCodeGenerator(db)
        return generator.generate_project(
            request.test_suite_ids,
            request.output_dir,
            request.config
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
