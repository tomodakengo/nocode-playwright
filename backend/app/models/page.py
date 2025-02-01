from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    url_pattern = Column(String, nullable=False)  # URLのパターン（正規表現可）
    description = Column(Text, nullable=True)
    selectors = Column(JSON, nullable=False, default=dict)  # セレクタの辞書
    wait_conditions = Column(JSON, nullable=True)  # 要素の待機条件
    iframe_selector = Column(String, nullable=True)  # iframeのセレクタ（存在する場合）
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーションシップ
    project = relationship("Project", back_populates="pages")
