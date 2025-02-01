import os
import json
import asyncio
import subprocess
from datetime import datetime
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.models.test_execution import TestExecution, TestResult, ExecutionStatus
from app.schemas.test_execution import (
    TestExecutionCreate,
    TestExecutionUpdate,
    TestResultCreate,
    TestExecutionFilter,
    TestExecutionStatistics,
)
from app.services import code_generator as code_generator_service

def get_test_execution(db: Session, execution_id: int) -> Optional[TestExecution]:
    return db.query(TestExecution).filter(TestExecution.id == execution_id).first()

def get_test_executions(
    db: Session,
    filter_params: TestExecutionFilter,
    skip: int = 0,
    limit: int = 100
) -> List[TestExecution]:
    query = db.query(TestExecution)
    
    if filter_params.project_id:
        query = query.filter(TestExecution.project_id == filter_params.project_id)
    if filter_params.test_suite_id:
        query = query.filter(TestExecution.test_suite_id == filter_params.test_suite_id)
    if filter_params.status:
        query = query.filter(TestExecution.status == filter_params.status)
    if filter_params.start_date:
        query = query.filter(TestExecution.created_at >= filter_params.start_date)
    if filter_params.end_date:
        query = query.filter(TestExecution.created_at <= filter_params.end_date)
    
    return query.offset(skip).limit(limit).all()

def create_test_execution(db: Session, execution: TestExecutionCreate) -> TestExecution:
    db_execution = TestExecution(**execution.model_dump())
    db.add(db_execution)
    db.commit()
    db.refresh(db_execution)
    return db_execution

def update_test_execution(
    db: Session,
    execution_id: int,
    execution: TestExecutionUpdate
) -> Optional[TestExecution]:
    db_execution = get_test_execution(db, execution_id)
    if db_execution:
        update_data = execution.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_execution, key, value)
        db.commit()
        db.refresh(db_execution)
    return db_execution

def create_test_result(db: Session, result: TestResultCreate) -> TestResult:
    db_result = TestResult(**result.model_dump())
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def get_execution_statistics(
    db: Session,
    project_id: Optional[int] = None,
    test_suite_id: Optional[int] = None
) -> TestExecutionStatistics:
    query = db.query(
        func.count(TestExecution.id).label("total"),
        func.sum(case([(TestExecution.status == ExecutionStatus.COMPLETED, 1)], else_=0)).label("passed"),
        func.sum(case([(TestExecution.status == ExecutionStatus.FAILED, 1)], else_=0)).label("failed"),
        func.avg(
            func.extract('epoch', TestExecution.end_time) - 
            func.extract('epoch', TestExecution.start_time)
        ).label("avg_duration")
    )

    if project_id:
        query = query.filter(TestExecution.project_id == project_id)
    if test_suite_id:
        query = query.filter(TestExecution.test_suite_id == test_suite_id)

    result = query.first()
    total = result.total or 0
    passed = result.passed or 0
    failed = result.failed or 0
    avg_duration = result.avg_duration or 0

    return TestExecutionStatistics(
        total_executions=total,
        passed_count=passed,
        failed_count=failed,
        average_duration=avg_duration,
        success_rate=(passed / total * 100) if total > 0 else 0
    )

async def execute_test(db: Session, execution_id: int):
    """テストを非同期で実行します"""
    execution = get_test_execution(db, execution_id)
    if not execution:
        return

    try:
        # ステータスを実行中に更新
        execution.status = ExecutionStatus.RUNNING
        execution.start_time = datetime.utcnow()
        db.commit()

        # テストコードを生成
        if execution.test_suite_id:
            test_code = code_generator_service.generate_test_case(
                db, execution.test_suite_id, execution.project_id
            )
        else:
            # プロジェクト全体のテストを実行
            test_code = code_generator_service.generate_project_tests(
                db, execution.project_id
            )

        # 一時的なテストファイルを作成
        test_dir = f"./temp/test_{execution_id}"
        os.makedirs(test_dir, exist_ok=True)
        test_file = os.path.join(test_dir, "test.spec.ts")
        with open(test_file, "w") as f:
            f.write(test_code)

        # Playwrightを実行
        process = await asyncio.create_subprocess_exec(
            "npx", "playwright", "test",
            test_file,
            "--browser", execution.browser_type,
            "--reporter", "json",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()
        
        # 結果を解析
        if process.returncode == 0:
            execution.status = ExecutionStatus.COMPLETED
            results = json.loads(stdout.decode())
        else:
            execution.status = ExecutionStatus.FAILED
            execution.error_message = stderr.decode()
            results = json.loads(stdout.decode()) if stdout else None

        # 結果を保存
        execution.end_time = datetime.utcnow()
        execution.results = results
        db.commit()

        # テスト結果を個別に保存
        if results and "suites" in results:
            for suite in results["suites"]:
                for spec in suite["specs"]:
                    result = TestResultCreate(
                        execution_id=execution_id,
                        test_case_id=int(spec.get("id", 0)),  # テストケースIDの取得方法は要調整
                        status="passed" if spec["ok"] else "failed",
                        duration=spec.get("duration"),
                        error_message=spec.get("error", {}).get("message") if not spec["ok"] else None,
                        screenshot_path=spec.get("attachments", [{}])[0].get("path"),
                        video_path=spec.get("video"),
                        logs=spec.get("stdout") + spec.get("stderr")
                    )
                    create_test_result(db, result)

    except Exception as e:
        execution.status = ExecutionStatus.FAILED
        execution.error_message = str(e)
        execution.end_time = datetime.utcnow()
        db.commit()
    finally:
        # 一時ファイルを削除
        if os.path.exists(test_dir):
            import shutil
            shutil.rmtree(test_dir) 