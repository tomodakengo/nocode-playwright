from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.test_case import TestCase
from app.schemas.test_case import (
    TestCaseCreate,
    TestCaseUpdate,
    TestCaseResponse
)

router = APIRouter(prefix="/test-cases", tags=["test-cases"])

@router.post("/", response_model=TestCaseResponse, status_code=status.HTTP_201_CREATED)
def create_test_case(test_case: TestCaseCreate, db: Session = Depends(get_db)):
    db_test_case = TestCase(**test_case.model_dump())
    db.add(db_test_case)
    db.commit()
    db.refresh(db_test_case)
    return db_test_case

@router.get("/", response_model=List[TestCaseResponse])
def get_test_cases(
    skip: int = 0,
    limit: int = 100,
    test_suite_id: int = None,
    db: Session = Depends(get_db)
):
    query = db.query(TestCase)
    if test_suite_id:
        query = query.filter(TestCase.test_suite_id == test_suite_id)
    return query.offset(skip).limit(limit).all()

@router.get("/{test_case_id}", response_model=TestCaseResponse)
def get_test_case(test_case_id: int, db: Session = Depends(get_db)):
    db_test_case = db.query(TestCase).filter(TestCase.id == test_case_id).first()
    if db_test_case is None:
        raise HTTPException(status_code=404, detail="Test case not found")
    return db_test_case

@router.put("/{test_case_id}", response_model=TestCaseResponse)
def update_test_case(
    test_case_id: int,
    test_case: TestCaseUpdate,
    db: Session = Depends(get_db)
):
    db_test_case = db.query(TestCase).filter(TestCase.id == test_case_id).first()
    if db_test_case is None:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    for key, value in test_case.model_dump(exclude_unset=True).items():
        setattr(db_test_case, key, value)
    
    db.commit()
    db.refresh(db_test_case)
    return db_test_case

@router.delete("/{test_case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test_case(test_case_id: int, db: Session = Depends(get_db)):
    db_test_case = db.query(TestCase).filter(TestCase.id == test_case_id).first()
    if db_test_case is None:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    db.delete(db_test_case)
    db.commit()
    return None
