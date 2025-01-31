from app.models.base import BaseModel
from app.models.test_suite import TestSuite
from app.models.test_case import TestCase
from app.models.page import Page

# Update TestSuite model with relationship
TestSuite.test_cases = relationship("TestCase", back_populates="test_suite", cascade="all, delete-orphan")
