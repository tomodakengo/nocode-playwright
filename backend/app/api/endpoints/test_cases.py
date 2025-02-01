from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.test_case import TestCase, TestCaseCreate, TestCaseUpdate
from app.services import test_case as test_case_service

router = APIRouter()

@router.get("/test-suites/{test_suite_id}/test-cases/", response_model=List[TestCase])
def read_test_cases(test_suite_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    test_cases = test_case_service.get_test_cases(db, test_suite_id=test_suite_id, skip=skip, limit=limit)
    return test_cases

@router.post("/test-suites/{test_suite_id}/test-cases/", response_model=TestCase)
def create_test_case(test_suite_id: int, test_case: TestCaseCreate, db: Session = Depends(get_db)):
    test_case.test_suite_id = test_suite_id
    return test_case_service.create_test_case(db=db, test_case=test_case)

@router.get("/test-cases/{test_case_id}", response_model=TestCase)
def read_test_case(test_case_id: int, db: Session = Depends(get_db)):
    db_test_case = test_case_service.get_test_case(db, test_case_id=test_case_id)
    if db_test_case is None:
        raise HTTPException(status_code=404, detail="Test case not found")
    return db_test_case

@router.put("/test-cases/{test_case_id}", response_model=TestCase)
def update_test_case(test_case_id: int, test_case: TestCaseUpdate, db: Session = Depends(get_db)):
    db_test_case = test_case_service.update_test_case(db, test_case_id=test_case_id, test_case=test_case)
    if db_test_case is None:
        raise HTTPException(status_code=404, detail="Test case not found")
    return db_test_case

@router.delete("/test-cases/{test_case_id}", response_model=TestCase)
def delete_test_case(test_case_id: int, db: Session = Depends(get_db)):
    db_test_case = test_case_service.delete_test_case(db, test_case_id=test_case_id)
    if db_test_case is None:
        raise HTTPException(status_code=404, detail="Test case not found")
    return db_test_case 