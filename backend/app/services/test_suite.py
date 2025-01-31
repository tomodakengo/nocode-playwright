from sqlalchemy.orm import Session
from app.models.test_suite import TestSuite
from app.services.base import BaseService
from typing import List, Optional

class TestSuiteService(BaseService[TestSuite]):
    def __init__(self, db: Session):
        super().__init__(TestSuite, db)

    def get_with_test_cases(self, id: int) -> Optional[TestSuite]:
        """Get test suite with all its test cases"""
        return (
            self.db.query(TestSuite)
            .filter(TestSuite.id == id)
            .first()
        )

    def get_by_name(self, name: str) -> Optional[TestSuite]:
        """Get test suite by name"""
        return (
            self.db.query(TestSuite)
            .filter(TestSuite.name == name)
            .first()
        )

    def create(self, obj_in: dict) -> TestSuite:
        """Create new test suite with validation"""
        # Check if test suite with same name exists
        existing = self.get_by_name(obj_in["name"])
        if existing:
            raise ValueError(f"Test suite with name '{obj_in['name']}' already exists")
        return super().create(obj_in)

    def update(self, id: int, obj_in: dict) -> TestSuite:
        """Update test suite with validation"""
        if "name" in obj_in:
            existing = self.get_by_name(obj_in["name"])
            if existing and existing.id != id:
                raise ValueError(f"Test suite with name '{obj_in['name']}' already exists")
        return super().update(id, obj_in)
