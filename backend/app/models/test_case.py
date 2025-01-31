from sqlalchemy import Column, String, Text, JSON, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class TestCase(BaseModel):
    __tablename__ = "test_cases"

    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    test_suite_id = Column(Integer, ForeignKey("test_suites.id"), nullable=False)
    steps = Column(JSON, nullable=False, default=list)
    before_each = Column(JSON, nullable=True)
    after_each = Column(JSON, nullable=True)
    
    # Relationships
    test_suite = relationship("TestSuite", back_populates="test_cases")
    
    def __repr__(self):
        return f"<TestCase {self.name}>"
