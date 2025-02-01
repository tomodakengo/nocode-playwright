from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class ExecutionStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TestExecution(Base):
    __tablename__ = "test_executions"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    test_suite_id = Column(Integer, ForeignKey("test_suites.id", ondelete="CASCADE"), nullable=True)
    status = Column(Enum(ExecutionStatus), nullable=False, default=ExecutionStatus.PENDING)
    browser_type = Column(String, nullable=False, default="chromium")
    environment = Column(JSON, nullable=True)  # 環境変数や設定
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    results = Column(JSON, nullable=True)  # テスト結果の詳細
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーションシップ
    project = relationship("Project", back_populates="test_executions")
    test_suite = relationship("TestSuite", back_populates="executions")

class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("test_executions.id", ondelete="CASCADE"), nullable=False)
    test_case_id = Column(Integer, ForeignKey("test_cases.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False)  # passed, failed, skipped, etc.
    duration = Column(Integer, nullable=True)  # 実行時間（ミリ秒）
    error_message = Column(Text, nullable=True)
    screenshot_path = Column(String, nullable=True)
    video_path = Column(String, nullable=True)
    logs = Column(JSON, nullable=True)  # 実行ログ
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # リレーションシップ
    execution = relationship("TestExecution", backref="test_results")
    test_case = relationship("TestCase", backref="test_results") 