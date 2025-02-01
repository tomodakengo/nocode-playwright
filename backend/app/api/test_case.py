from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.test_case import TestCase
from app.schemas.test_case import TestCase as TestCaseSchema
from app.schemas.test_case import TestCaseCreate, TestCaseUpdate
from app.services.test_case import TestCaseService

router = APIRouter(prefix="/test-cases", tags=["test-cases"])
service = TestCaseService()

@router.post("/", response_model=TestCaseSchema, status_code=status.HTTP_201_CREATED)
def create_test_case(test_case: TestCaseCreate, db: Session = Depends(get_db)):
    return service.create(db, test_case)

@router.get("/", response_model=List[TestCaseSchema])
def get_test_cases(
    skip: int = 0,
    limit: int = 100,
    test_suite_id: int = None,
    db: Session = Depends(get_db)
):
    if test_suite_id:
        return service.get_by_test_suite(db, test_suite_id)
    return service.get_multi(db, skip=skip, limit=limit)

@router.get("/{test_case_id}", response_model=TestCaseSchema)
def get_test_case(test_case_id: int, db: Session = Depends(get_db)):
    test_case = service.get(db, test_case_id)
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    return test_case

@router.put("/{test_case_id}", response_model=TestCaseSchema)
def update_test_case(
    test_case_id: int,
    test_case: TestCaseUpdate,
    db: Session = Depends(get_db)
):
    db_test_case = service.get(db, test_case_id)
    if not db_test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    return service.update(db, db_obj=db_test_case, obj_in=test_case)

@router.delete("/{test_case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test_case(test_case_id: int, db: Session = Depends(get_db)):
    test_case = service.get(db, test_case_id)
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    service.delete(db, id=test_case_id)
    return None
