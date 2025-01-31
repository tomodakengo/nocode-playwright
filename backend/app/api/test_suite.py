from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.test_suite import TestSuite
from app.schemas.test_suite import (
    TestSuiteCreate,
    TestSuiteUpdate,
    TestSuiteResponse,
    TestSuiteWithTestCases
)

router = APIRouter(prefix="/test-suites", tags=["test-suites"])

@router.post("/", response_model=TestSuiteResponse, status_code=status.HTTP_201_CREATED)
def create_test_suite(test_suite: TestSuiteCreate, db: Session = Depends(get_db)):
    db_test_suite = TestSuite(**test_suite.model_dump())
    db.add(db_test_suite)
    db.commit()
    db.refresh(db_test_suite)
    return db_test_suite

@router.get("/", response_model=List[TestSuiteResponse])
def get_test_suites(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(TestSuite).offset(skip).limit(limit).all()

@router.get("/{test_suite_id}", response_model=TestSuiteWithTestCases)
def get_test_suite(test_suite_id: int, db: Session = Depends(get_db)):
    db_test_suite = db.query(TestSuite).filter(TestSuite.id == test_suite_id).first()
    if db_test_suite is None:
        raise HTTPException(status_code=404, detail="Test suite not found")
    return db_test_suite

@router.put("/{test_suite_id}", response_model=TestSuiteResponse)
def update_test_suite(
    test_suite_id: int,
    test_suite: TestSuiteUpdate,
    db: Session = Depends(get_db)
):
    db_test_suite = db.query(TestSuite).filter(TestSuite.id == test_suite_id).first()
    if db_test_suite is None:
        raise HTTPException(status_code=404, detail="Test suite not found")
    
    for key, value in test_suite.model_dump(exclude_unset=True).items():
        setattr(db_test_suite, key, value)
    
    db.commit()
    db.refresh(db_test_suite)
    return db_test_suite

@router.delete("/{test_suite_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test_suite(test_suite_id: int, db: Session = Depends(get_db)):
    db_test_suite = db.query(TestSuite).filter(TestSuite.id == test_suite_id).first()
    if db_test_suite is None:
        raise HTTPException(status_code=404, detail="Test suite not found")
    
    db.delete(db_test_suite)
    db.commit()
    return None
