from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.code_generator import CodeType
from app.schemas.code_generator import GeneratedCode, CodeGeneratorCreate
from app.services import code_generator as code_generator_service

router = APIRouter()

@router.get("/projects/{project_id}/generated-code/", response_model=List[GeneratedCode])
def read_generated_code_list(project_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return code_generator_service.get_generated_code_list(db, project_id=project_id, skip=skip, limit=limit)

@router.get("/generated-code/{code_id}", response_model=GeneratedCode)
def read_generated_code(code_id: int, db: Session = Depends(get_db)):
    db_code = code_generator_service.get_generated_code(db, code_id=code_id)
    if db_code is None:
        raise HTTPException(status_code=404, detail="Generated code not found")
    return db_code

@router.post("/projects/{project_id}/pages/{page_id}/generate", response_model=GeneratedCode)
def generate_page_object(project_id: int, page_id: int, db: Session = Depends(get_db)):
    content = code_generator_service.generate_page_object(db, page_id=page_id, project_id=project_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Page not found")
    
    code = CodeGeneratorCreate(
        name=f"page_object_{page_id}",
        code_type=CodeType.PAGE_OBJECT,
        source_id=page_id,
        project_id=project_id
    )
    return code_generator_service.create_generated_code(db=db, code=code, content=content)

@router.post("/projects/{project_id}/test-cases/{test_case_id}/generate", response_model=GeneratedCode)
def generate_test_case(project_id: int, test_case_id: int, db: Session = Depends(get_db)):
    content = code_generator_service.generate_test_case(db, test_case_id=test_case_id, project_id=project_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    code = CodeGeneratorCreate(
        name=f"test_case_{test_case_id}",
        code_type=CodeType.TEST_CASE,
        source_id=test_case_id,
        project_id=project_id
    )
    return code_generator_service.create_generated_code(db=db, code=code, content=content)

@router.post("/projects/{project_id}/config/generate", response_model=GeneratedCode)
def generate_config(project_id: int, db: Session = Depends(get_db)):
    content = code_generator_service.generate_config(db, project_id=project_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    code = CodeGeneratorCreate(
        name="playwright_config",
        code_type=CodeType.CONFIG,
        source_id=project_id,
        project_id=project_id
    )
    return code_generator_service.create_generated_code(db=db, code=code, content=content)

@router.delete("/generated-code/{code_id}", response_model=GeneratedCode)
def delete_generated_code(code_id: int, db: Session = Depends(get_db)):
    db_code = code_generator_service.delete_generated_code(db, code_id=code_id)
    if db_code is None:
        raise HTTPException(status_code=404, detail="Generated code not found")
    return db_code 