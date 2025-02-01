import base64
import csv
import json
import io
import yaml
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.test_data import TestData, TestCaseData, DataFormat
from app.schemas.test_data import TestDataCreate, TestDataUpdate, TestDataImport

def get_test_data(db: Session, test_data_id: int):
    return db.query(TestData).filter(TestData.id == test_data_id).first()

def get_test_data_list(db: Session, project_id: int, skip: int = 0, limit: int = 100):
    return db.query(TestData).filter(TestData.project_id == project_id).offset(skip).limit(limit).all()

def create_test_data(db: Session, test_data: TestDataCreate):
    db_test_data = TestData(**test_data.model_dump())
    db.add(db_test_data)
    db.commit()
    db.refresh(db_test_data)
    return db_test_data

def update_test_data(db: Session, test_data_id: int, test_data: TestDataUpdate):
    db_test_data = get_test_data(db, test_data_id)
    if db_test_data:
        update_data = test_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_test_data, key, value)
        db.commit()
        db.refresh(db_test_data)
    return db_test_data

def delete_test_data(db: Session, test_data_id: int):
    db_test_data = get_test_data(db, test_data_id)
    if db_test_data:
        db.delete(db_test_data)
        db.commit()
    return db_test_data

def import_test_data(db: Session, project_id: int, import_data: TestDataImport) -> TestData:
    # Base64デコード
    file_content = base64.b64decode(import_data.file_content).decode('utf-8')
    
    # フォーマットに応じてデータをパース
    if import_data.format == DataFormat.JSON:
        data = json.loads(file_content)
    elif import_data.format == DataFormat.CSV:
        csv_reader = csv.DictReader(io.StringIO(file_content))
        data = [row for row in csv_reader]
    elif import_data.format == DataFormat.YAML:
        data = yaml.safe_load(file_content)
    else:
        raise ValueError(f"Unsupported format: {import_data.format}")

    # テストデータを作成
    test_data = TestDataCreate(
        name=import_data.name,
        description=import_data.description,
        format=import_data.format,
        data=data,
        project_id=project_id
    )
    
    return create_test_data(db, test_data)

def export_test_data(db: Session, test_data_id: int) -> str:
    db_test_data = get_test_data(db, test_data_id)
    if not db_test_data:
        return None

    # フォーマットに応じてデータをエクスポート
    if db_test_data.format == DataFormat.JSON:
        content = json.dumps(db_test_data.data, indent=2)
    elif db_test_data.format == DataFormat.CSV:
        output = io.StringIO()
        if isinstance(db_test_data.data, list) and len(db_test_data.data) > 0:
            writer = csv.DictWriter(output, fieldnames=db_test_data.data[0].keys())
            writer.writeheader()
            writer.writerows(db_test_data.data)
        content = output.getvalue()
    elif db_test_data.format == DataFormat.YAML:
        content = yaml.dump(db_test_data.data, allow_unicode=True)
    else:
        raise ValueError(f"Unsupported format: {db_test_data.format}")

    # Base64エンコード
    return base64.b64encode(content.encode('utf-8')).decode('utf-8')

def assign_test_data_to_test_case(db: Session, test_case_id: int, test_data_id: int):
    db_test_case_data = TestCaseData(
        test_case_id=test_case_id,
        test_data_id=test_data_id
    )
    db.add(db_test_case_data)
    db.commit()
    return db_test_case_data

def remove_test_data_from_test_case(db: Session, test_case_id: int, test_data_id: int):
    db.query(TestCaseData).filter(
        TestCaseData.test_case_id == test_case_id,
        TestCaseData.test_data_id == test_data_id
    ).delete()
    db.commit() 