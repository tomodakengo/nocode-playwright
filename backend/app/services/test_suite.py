from sqlalchemy.orm import Session
from app.models.test_suite import TestSuite
from app.schemas.test_suite import TestSuiteCreate, TestSuiteUpdate

def get_test_suite(db: Session, test_suite_id: int):
    return db.query(TestSuite).filter(TestSuite.id == test_suite_id).first()

def get_test_suites(db: Session, project_id: int, skip: int = 0, limit: int = 100):
    return db.query(TestSuite).filter(TestSuite.project_id == project_id).offset(skip).limit(limit).all()

def create_test_suite(db: Session, test_suite: TestSuiteCreate):
    db_test_suite = TestSuite(**test_suite.model_dump())
    db.add(db_test_suite)
    db.commit()
    db.refresh(db_test_suite)
    return db_test_suite

def update_test_suite(db: Session, test_suite_id: int, test_suite: TestSuiteUpdate):
    db_test_suite = get_test_suite(db, test_suite_id)
    if db_test_suite:
        for key, value in test_suite.model_dump(exclude_unset=True).items():
            setattr(db_test_suite, key, value)
        db.commit()
        db.refresh(db_test_suite)
    return db_test_suite

def delete_test_suite(db: Session, test_suite_id: int):
    db_test_suite = get_test_suite(db, test_suite_id)
    if db_test_suite:
        db.delete(db_test_suite)
        db.commit()
    return db_test_suite
