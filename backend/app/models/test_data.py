from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class DataFormat(str, enum.Enum):
    JSON = "json"
    CSV = "csv"
    YAML = "yaml"

class TestData(Base):
    __tablename__ = "test_data"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    format = Column(Enum(DataFormat), nullable=False, default=DataFormat.JSON)
    data = Column(JSON, nullable=False)  # 実際のテストデータ
    variables = Column(JSON, nullable=True)  # 変数定義（置換用）
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーションシップ
    project = relationship("Project", back_populates="test_data")
    test_cases = relationship("TestCase", secondary="test_case_data", back_populates="test_data")

class TestCaseData(Base):
    __tablename__ = "test_case_data"

    test_case_id = Column(Integer, ForeignKey("test_cases.id", ondelete="CASCADE"), primary_key=True)
    test_data_id = Column(Integer, ForeignKey("test_data.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now()) 