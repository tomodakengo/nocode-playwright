from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.test_execution import (
    TestExecution,
    TestExecutionCreate,
    TestExecutionUpdate,
    TestExecutionWithResults,
    TestExecutionFilter,
    TestExecutionStatistics,
)
from app.services import test_execution as test_execution_service

router = APIRouter()

@router.get("/projects/{project_id}/executions/", response_model=List[TestExecution])
def read_test_executions(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    filter_params = TestExecutionFilter(project_id=project_id)
    return test_execution_service.get_test_executions(db, filter_params, skip=skip, limit=limit)

@router.post("/projects/{project_id}/executions/", response_model=TestExecution)
def create_test_execution(
    project_id: int,
    execution: TestExecutionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    execution.project_id = project_id
    db_execution = test_execution_service.create_test_execution(db=db, execution=execution)
    
    # テスト実行をバックグラウンドで開始
    background_tasks.add_task(test_execution_service.execute_test, db, db_execution.id)
    
    return db_execution

@router.get("/executions/{execution_id}", response_model=TestExecutionWithResults)
def read_test_execution(execution_id: int, db: Session = Depends(get_db)):
    db_execution = test_execution_service.get_test_execution(db, execution_id=execution_id)
    if db_execution is None:
        raise HTTPException(status_code=404, detail="Test execution not found")
    return db_execution

@router.put("/executions/{execution_id}", response_model=TestExecution)
def update_test_execution(
    execution_id: int,
    execution: TestExecutionUpdate,
    db: Session = Depends(get_db)
):
    db_execution = test_execution_service.update_test_execution(
        db, execution_id=execution_id, execution=execution
    )
    if db_execution is None:
        raise HTTPException(status_code=404, detail="Test execution not found")
    return db_execution

@router.post("/executions/{execution_id}/cancel", response_model=TestExecution)
def cancel_test_execution(execution_id: int, db: Session = Depends(get_db)):
    update = TestExecutionUpdate(status="cancelled")
    db_execution = test_execution_service.update_test_execution(
        db, execution_id=execution_id, execution=update
    )
    if db_execution is None:
        raise HTTPException(status_code=404, detail="Test execution not found")
    return db_execution

@router.get("/projects/{project_id}/statistics", response_model=TestExecutionStatistics)
def get_project_statistics(
    project_id: int,
    test_suite_id: int = None,
    db: Session = Depends(get_db)
):
    return test_execution_service.get_execution_statistics(
        db,
        project_id=project_id,
        test_suite_id=test_suite_id
    ) 