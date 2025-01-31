from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.services.test_suite import TestSuiteService
from app.schemas.test_suite import (
    TestSuiteCreate,
    TestSuiteUpdate,
    TestSuiteResponse,
    TestSuiteWithTestCases
)

router = APIRouter(prefix="/test-suites", tags=["test-suites"])

@router.post("/", response_model=TestSuiteResponse, status_code=status.HTTP_201_CREATED)
def create_test_suite(test_suite: TestSuiteCreate, db: Session = Depends(get_db)):
    try:
        service = TestSuiteService(db)
        return service.create(test_suite.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[TestSuiteResponse])
def get_test_suites(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    service = TestSuiteService(db)
    return service.get_multi(skip=skip, limit=limit)

@router.get("/{test_suite_id}", response_model=TestSuiteWithTestCases)
def get_test_suite(test_suite_id: int, db: Session = Depends(get_db)):
    try:
        service = TestSuiteService(db)
        test_suite = service.get_with_test_cases(test_suite_id)
        if not test_suite:
            raise HTTPException(status_code=404, detail="Test suite not found")
        return test_suite
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{test_suite_id}", response_model=TestSuiteResponse)
def update_test_suite(
    test_suite_id: int,
    test_suite: TestSuiteUpdate,
    db: Session = Depends(get_db)
):
    try:
        service = TestSuiteService(db)
        updated_test_suite = service.update(test_suite_id, test_suite.model_dump(exclude_unset=True))
        if not updated_test_suite:
            raise HTTPException(status_code=404, detail="Test suite not found")
        return updated_test_suite
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{test_suite_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test_suite(test_suite_id: int, db: Session = Depends(get_db)):
    try:
        service = TestSuiteService(db)
        service.delete(test_suite_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
