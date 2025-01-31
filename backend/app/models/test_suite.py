from sqlalchemy import Column, String, Text, JSON
from app.models.base import BaseModel

class TestSuite(BaseModel):
    __tablename__ = "test_suites"

    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    configuration = Column(JSON, nullable=False, default=dict)
    
    def __repr__(self):
        return f"<TestSuite {self.name}>"
