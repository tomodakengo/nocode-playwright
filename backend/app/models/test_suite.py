from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class TestSuiteType(str, enum.Enum):
    SMOKE = "smoke"
    REGRESSION = "regression"
    INTEGRATION = "integration"
    E2E = "e2e"

class TestSuite(Base):
    __tablename__ = "test_suites"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    type = Column(Enum(TestSuiteType), nullable=False, default=TestSuiteType.E2E)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    browser_type = Column(String, nullable=False, default="chromium")  # chromium, firefox, webkit
    device_settings = Column(Text, nullable=True)  # JSON形式でデバイス設定を保存
    parallel_execution = Column(Integer, default=1)  # 並行実行数
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    project = relationship("Project", back_populates="test_suites")
    test_cases = relationship("TestCase", back_populates="test_suite", cascade="all, delete-orphan")
    executions = relationship("TestExecution", back_populates="test_suite", cascade="all, delete-orphan")
