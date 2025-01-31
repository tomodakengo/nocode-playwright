from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.services.test_case import TestCaseService
from app.schemas.test_case import (
    TestCaseCreate,
    TestCaseUpdate,
    TestCaseResponse
)

router = APIRouter(prefix="/test-cases", tags=["test-cases"])

@router.post("/", response_model=TestCaseResponse, status_code=status.HTTP_201_CREATED)
def create_test_case(test_case: TestCaseCreate, db: Session = Depends(get_db)):
    try:
        service = TestCaseService(db)
        return service.create(test_case.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[TestCaseResponse])
def get_test_cases(
    skip: int = 0,
    limit: int = 100,
    test_suite_id: int = None,
    db: Session = Depends(get_db)
):
    service = TestCaseService(db)
    if test_suite_id:
        return service.get_by_test_suite(test_suite_id)
    return service.get_multi(skip=skip, limit=limit)

@router.get("/{test_case_id}", response_model=TestCaseResponse)
def get_test_case(test_case_id: int, db: Session = Depends(get_db)):
    try:
        service = TestCaseService(db)
        test_case = service.get(test_case_id)
        if not test_case:
            raise HTTPException(status_code=404, detail="Test case not found")
        return test_case
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{test_case_id}", response_model=TestCaseResponse)
def update_test_case(
    test_case_id: int,
    test_case: TestCaseUpdate,
    db: Session = Depends(get_db)
):
    try:
        service = TestCaseService(db)
        updated_test_case = service.update(test_case_id, test_case.model_dump(exclude_unset=True))
        if not updated_test_case:
            raise HTTPException(status_code=404, detail="Test case not found")
        return updated_test_case
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{test_case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test_case(test_case_id: int, db: Session = Depends(get_db)):
    try:
        service = TestCaseService(db)
        service.delete(test_case_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
