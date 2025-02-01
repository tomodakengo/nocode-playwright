from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class CodeType(str, enum.Enum):
    PAGE_OBJECT = "page_object"
    TEST_CASE = "test_case"
    CONFIG = "config"

class GeneratedCode(Base):
    __tablename__ = "generated_code"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    code_type = Column(Enum(CodeType), nullable=False)
    content = Column(Text, nullable=False)  # 生成されたコード
    source_id = Column(Integer, nullable=False)  # ページ、テストケース、またはプロジェクトのID
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    metadata = Column(JSON, nullable=True)  # 追加の設定や情報
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーションシップ
    project = relationship("Project", back_populates="generated_code") 