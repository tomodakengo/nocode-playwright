from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    test_suite_id = Column(Integer, ForeignKey("test_suites.id", ondelete="CASCADE"), nullable=False)
    priority = Column(Integer, default=1)  # 1: 高, 2: 中, 3: 低
    steps = Column(JSON, nullable=False, default=list)  # テストステップのリスト
    expected_results = Column(JSON, nullable=True)  # 期待される結果
    screenshot_timing = Column(String, default="on-failure")  # never, on-failure, always
    is_enabled = Column(Boolean, default=True)  # テストケースの有効/無効
    dependencies = Column(JSON, nullable=True)  # 依存するテストケースのID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーションシップ
    test_suite = relationship("TestSuite", back_populates="test_cases")
    before_each = Column(JSON, nullable=True)  # 前処理のステップ
    after_each = Column(JSON, nullable=True)  # 後処理のステップ
    test_data = relationship("TestData", secondary="test_case_data", back_populates="test_cases")
