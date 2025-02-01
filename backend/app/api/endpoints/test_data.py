from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.test_data import TestData, TestDataCreate, TestDataUpdate, TestDataImport
from app.services import test_data as test_data_service

router = APIRouter()

@router.get("/projects/{project_id}/test-data/", response_model=List[TestData])
def read_test_data_list(project_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    test_data_list = test_data_service.get_test_data_list(db, project_id=project_id, skip=skip, limit=limit)
    return test_data_list

@router.post("/projects/{project_id}/test-data/", response_model=TestData)
def create_test_data(project_id: int, test_data: TestDataCreate, db: Session = Depends(get_db)):
    test_data.project_id = project_id
    return test_data_service.create_test_data(db=db, test_data=test_data)

@router.post("/projects/{project_id}/test-data/import", response_model=TestData)
def import_test_data(project_id: int, import_data: TestDataImport, db: Session = Depends(get_db)):
    try:
        return test_data_service.import_test_data(db=db, project_id=project_id, import_data=import_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/test-data/{test_data_id}", response_model=TestData)
def read_test_data(test_data_id: int, db: Session = Depends(get_db)):
    db_test_data = test_data_service.get_test_data(db, test_data_id=test_data_id)
    if db_test_data is None:
        raise HTTPException(status_code=404, detail="Test data not found")
    return db_test_data

@router.get("/test-data/{test_data_id}/export")
def export_test_data(test_data_id: int, db: Session = Depends(get_db)):
    content = test_data_service.export_test_data(db, test_data_id=test_data_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Test data not found")
    return {"content": content}

@router.put("/test-data/{test_data_id}", response_model=TestData)
def update_test_data(test_data_id: int, test_data: TestDataUpdate, db: Session = Depends(get_db)):
    db_test_data = test_data_service.update_test_data(db, test_data_id=test_data_id, test_data=test_data)
    if db_test_data is None:
        raise HTTPException(status_code=404, detail="Test data not found")
    return db_test_data

@router.delete("/test-data/{test_data_id}", response_model=TestData)
def delete_test_data(test_data_id: int, db: Session = Depends(get_db)):
    db_test_data = test_data_service.delete_test_data(db, test_data_id=test_data_id)
    if db_test_data is None:
        raise HTTPException(status_code=404, detail="Test data not found")
    return db_test_data

@router.post("/test-cases/{test_case_id}/test-data/{test_data_id}")
def assign_test_data_to_test_case(test_case_id: int, test_data_id: int, db: Session = Depends(get_db)):
    return test_data_service.assign_test_data_to_test_case(db, test_case_id=test_case_id, test_data_id=test_data_id)

@router.delete("/test-cases/{test_case_id}/test-data/{test_data_id}")
def remove_test_data_from_test_case(test_case_id: int, test_data_id: int, db: Session = Depends(get_db)):
    test_data_service.remove_test_data_from_test_case(db, test_case_id=test_case_id, test_data_id=test_data_id)
    return {"status": "success"} 