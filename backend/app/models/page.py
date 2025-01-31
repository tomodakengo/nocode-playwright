from sqlalchemy import Column, String, Text, JSON
from app.models.base import BaseModel

class Page(BaseModel):
    __tablename__ = "pages"

    name = Column(String, index=True, nullable=False)
    url_pattern = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    selectors = Column(JSON, nullable=False, default=dict)
    
    def __repr__(self):
        return f"<Page {self.name}>"
