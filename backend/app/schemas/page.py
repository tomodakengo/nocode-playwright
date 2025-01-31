from typing import Optional, Dict
from app.schemas.base import BaseSchema, BaseResponseSchema

class PageBase(BaseSchema):
    name: str
    url_pattern: str
    description: Optional[str] = None
    selectors: Dict = {}

class PageCreate(PageBase):
    pass

class PageUpdate(PageBase):
    name: Optional[str] = None
    url_pattern: Optional[str] = None

class PageResponse(PageBase, BaseResponseSchema):
    pass
