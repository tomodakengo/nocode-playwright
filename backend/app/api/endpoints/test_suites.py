from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.test_suite import TestSuite, TestSuiteCreate, TestSuiteUpdate
from app.services import test_suite as test_suite_service

router = APIRouter()

@router.get("/projects/{project_id}/test-suites/", response_model=List[TestSuite])
def read_test_suites(project_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    test_suites = test_suite_service.get_test_suites(db, project_id=project_id, skip=skip, limit=limit)
    return test_suites

@router.post("/projects/{project_id}/test-suites/", response_model=TestSuite)
def create_test_suite(project_id: int, test_suite: TestSuiteCreate, db: Session = Depends(get_db)):
    test_suite.project_id = project_id
    return test_suite_service.create_test_suite(db=db, test_suite=test_suite)

@router.get("/test-suites/{test_suite_id}", response_model=TestSuite)
def read_test_suite(test_suite_id: int, db: Session = Depends(get_db)):
    db_test_suite = test_suite_service.get_test_suite(db, test_suite_id=test_suite_id)
    if db_test_suite is None:
        raise HTTPException(status_code=404, detail="Test suite not found")
    return db_test_suite

@router.put("/test-suites/{test_suite_id}", response_model=TestSuite)
def update_test_suite(test_suite_id: int, test_suite: TestSuiteUpdate, db: Session = Depends(get_db)):
    db_test_suite = test_suite_service.update_test_suite(db, test_suite_id=test_suite_id, test_suite=test_suite)
    if db_test_suite is None:
        raise HTTPException(status_code=404, detail="Test suite not found")
    return db_test_suite

@router.delete("/test-suites/{test_suite_id}", response_model=TestSuite)
def delete_test_suite(test_suite_id: int, db: Session = Depends(get_db)):
    db_test_suite = test_suite_service.delete_test_suite(db, test_suite_id=test_suite_id)
    if db_test_suite is None:
        raise HTTPException(status_code=404, detail="Test suite not found")
    return db_test_suite 