from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.test_suite import TestSuite
from app.schemas.test_suite import TestSuite as TestSuiteSchema
from app.schemas.test_suite import TestSuiteCreate, TestSuiteUpdate
from app.services.test_suite import TestSuiteService

router = APIRouter(prefix="/test-suites", tags=["test-suites"])
service = TestSuiteService()

@router.post("/", response_model=TestSuiteSchema, status_code=status.HTTP_201_CREATED)
def create_test_suite(test_suite: TestSuiteCreate, db: Session = Depends(get_db)):
    return service.create(db, test_suite)

@router.get("/", response_model=List[TestSuiteSchema])
def get_test_suites(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return service.get_multi(db, skip=skip, limit=limit)

@router.get("/{test_suite_id}", response_model=TestSuiteSchema)
def get_test_suite(test_suite_id: int, db: Session = Depends(get_db)):
    test_suite = service.get(db, test_suite_id)
    if not test_suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    return test_suite

@router.put("/{test_suite_id}", response_model=TestSuiteSchema)
def update_test_suite(test_suite_id: int, test_suite: TestSuiteUpdate, db: Session = Depends(get_db)):
    db_test_suite = service.get(db, test_suite_id)
    if not db_test_suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    return service.update(db, db_obj=db_test_suite, obj_in=test_suite)

@router.delete("/{test_suite_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test_suite(test_suite_id: int, db: Session = Depends(get_db)):
    test_suite = service.get(db, test_suite_id)
    if not test_suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    service.delete(db, id=test_suite_id)
    return None
