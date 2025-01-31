from sqlalchemy.orm import Session
from app.models.page import Page
from app.services.base import BaseService
from typing import Optional, Dict
import re

class PageService(BaseService[Page]):
    def __init__(self, db: Session):
        super().__init__(Page, db)

    def get_by_name(self, name: str) -> Optional[Page]:
        """Get page by name"""
        return self.db.query(Page).filter(Page.name == name).first()

    def get_by_url_pattern(self, url_pattern: str) -> Optional[Page]:
        """Get page by URL pattern"""
        return self.db.query(Page).filter(Page.url_pattern == url_pattern).first()

    def create(self, obj_in: dict) -> Page:
        """Create new page with validation"""
        # Validate name uniqueness
        existing = self.get_by_name(obj_in["name"])
        if existing:
            raise ValueError(f"Page with name '{obj_in['name']}' already exists")

        # Validate URL pattern
        self._validate_url_pattern(obj_in["url_pattern"])

        # Validate selectors
        if "selectors" in obj_in:
            self._validate_selectors(obj_in["selectors"])

        return super().create(obj_in)

    def update(self, id: int, obj_in: dict) -> Page:
        """Update page with validation"""
        if "name" in obj_in:
            existing = self.get_by_name(obj_in["name"])
            if existing and existing.id != id:
                raise ValueError(f"Page with name '{obj_in['name']}' already exists")

        if "url_pattern" in obj_in:
            self._validate_url_pattern(obj_in["url_pattern"])

        if "selectors" in obj_in:
            self._validate_selectors(obj_in["selectors"])

        return super().update(id, obj_in)

    def _validate_url_pattern(self, url_pattern: str) -> None:
        """Validate URL pattern format"""
        try:
            # Simple URL pattern validation
            if not url_pattern.startswith(("http://", "https://", "*")):
                raise ValueError("URL pattern must start with http://, https://, or *")

            # Check if it's a valid regex pattern
            re.compile(url_pattern.replace("*", ".*"))
        except re.error:
            raise ValueError("Invalid URL pattern format")

    def _validate_selectors(self, selectors: Dict) -> None:
        """Validate selectors format"""
        if not isinstance(selectors, dict):
            raise ValueError("Selectors must be a dictionary")

        for name, selector in selectors.items():
            if not isinstance(name, str):
                raise ValueError("Selector names must be strings")

            if not isinstance(selector, dict):
                raise ValueError(f"Selector '{name}' must be a dictionary")

            required_fields = {"type", "value"}
            missing_fields = required_fields - set(selector.keys())
            if missing_fields:
                raise ValueError(f"Selector '{name}' is missing required fields: {missing_fields}")

            valid_types = {"xpath", "css", "id", "name", "text"}
            if selector["type"] not in valid_types:
                raise ValueError(f"Invalid selector type for '{name}': {selector['type']}")

            if not isinstance(selector["value"], str):
                raise ValueError(f"Selector value for '{name}' must be a string")
