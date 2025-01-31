from sqlalchemy.orm import Session
from app.models.test_case import TestCase
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
