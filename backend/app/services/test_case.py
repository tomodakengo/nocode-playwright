from sqlalchemy.orm import Session
from app.models.test_case import TestCase
from app.schemas.test_case import TestCaseCreate, TestCaseUpdate
from app.services.base import BaseService
from typing import List, Optional, Dict

class TestCaseService(BaseService[TestCase]):
    def __init__(self, db: Session):
        super().__init__(TestCase, db)

    def get_by_test_suite(self, test_suite_id: int) -> List[TestCase]:
        """Get all test cases for a test suite"""
        return (
            self.db.query(TestCase)
            .filter(TestCase.test_suite_id == test_suite_id)
            .all()
        )

    def get_by_name_and_suite(self, name: str, test_suite_id: int) -> Optional[TestCase]:
        """Get test case by name within a test suite"""
        return (
            self.db.query(TestCase)
            .filter(TestCase.name == name, TestCase.test_suite_id == test_suite_id)
            .first()
        )

    def create(self, obj_in: dict) -> TestCase:
        """Create new test case with validation"""
        # Check if test case with same name exists in the suite
        existing = self.get_by_name_and_suite(obj_in["name"], obj_in["test_suite_id"])
        if existing:
            raise ValueError(
                f"Test case with name '{obj_in['name']}' already exists in this test suite"
            )
        
        # Validate steps format
        self._validate_steps(obj_in.get("steps", []))
        
        return super().create(obj_in)

    def update(self, id: int, obj_in: dict) -> TestCase:
        """Update test case with validation"""
        current = self.get(id)
        
        if "name" in obj_in and "test_suite_id" in obj_in:
            existing = self.get_by_name_and_suite(obj_in["name"], obj_in["test_suite_id"])
            if existing and existing.id != id:
                raise ValueError(
                    f"Test case with name '{obj_in['name']}' already exists in this test suite"
                )
        
        # Validate steps format if provided
        if "steps" in obj_in:
            self._validate_steps(obj_in["steps"])
        
        return super().update(id, obj_in)

    def _validate_steps(self, steps: List[Dict]) -> None:
        """Validate test case steps format"""
        required_fields = {"action", "selector", "value"}
        
        for step in steps:
            if not isinstance(step, dict):
                raise ValueError("Each step must be a dictionary")
            
            # Check required fields
            missing_fields = required_fields - set(step.keys())
            if missing_fields:
                raise ValueError(f"Step is missing required fields: {missing_fields}")
            
            # Validate action type
            valid_actions = {"click", "type", "select", "hover", "wait", "assert"}
            if step["action"] not in valid_actions:
                raise ValueError(f"Invalid action: {step['action']}")
            
            # Additional validation based on action type
            if step["action"] == "type" and not step["value"]:
                raise ValueError("Type action requires a value")

def get_test_case(db: Session, test_case_id: int):
    return db.query(TestCase).filter(TestCase.id == test_case_id).first()

def get_test_cases(db: Session, test_suite_id: int, skip: int = 0, limit: int = 100):
    return db.query(TestCase).filter(TestCase.test_suite_id == test_suite_id).offset(skip).limit(limit).all()

def create_test_case(db: Session, test_case: TestCaseCreate):
    # ステップデータをJSONに変換
    test_case_data = test_case.model_dump()
    test_case_data["steps"] = [step.model_dump() for step in test_case.steps]
    if test_case.expected_results:
        test_case_data["expected_results"] = [result.model_dump() for result in test_case.expected_results]
    if test_case.before_each:
        test_case_data["before_each"] = [step.model_dump() for step in test_case.before_each]
    if test_case.after_each:
        test_case_data["after_each"] = [step.model_dump() for step in test_case.after_each]

    db_test_case = TestCase(**test_case_data)
    db.add(db_test_case)
    db.commit()
    db.refresh(db_test_case)
    return db_test_case

def update_test_case(db: Session, test_case_id: int, test_case: TestCaseUpdate):
    db_test_case = get_test_case(db, test_case_id)
    if db_test_case:
        # ステップデータをJSONに変換
        update_data = test_case.model_dump(exclude_unset=True)
        if "steps" in update_data:
            update_data["steps"] = [step.model_dump() for step in test_case.steps]
        if "expected_results" in update_data and test_case.expected_results:
            update_data["expected_results"] = [result.model_dump() for result in test_case.expected_results]
        if "before_each" in update_data and test_case.before_each:
            update_data["before_each"] = [step.model_dump() for step in test_case.before_each]
        if "after_each" in update_data and test_case.after_each:
            update_data["after_each"] = [step.model_dump() for step in test_case.after_each]

        for key, value in update_data.items():
            setattr(db_test_case, key, value)
        db.commit()
        db.refresh(db_test_case)
    return db_test_case

def delete_test_case(db: Session, test_case_id: int):
    db_test_case = get_test_case(db, test_case_id)
    if db_test_case:
        db.delete(db_test_case)
        db.commit()
    return db_test_case
