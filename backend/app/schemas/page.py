from datetime import datetime
from typing import Dict, Optional, Any
from pydantic import BaseModel, Field

class Selector(BaseModel):
    xpath: str
    description: Optional[str] = None
    wait_condition: Optional[str] = None  # visible, clickable, present, etc.
    timeout: Optional[int] = Field(default=30, ge=1)  # 待機時間（秒）

class WaitCondition(BaseModel):
    selector: str
    condition: str  # visible, clickable, present, etc.
    timeout: int = Field(default=30, ge=1)

class PageBase(BaseModel):
    name: str
    url_pattern: str
    description: Optional[str] = None
    selectors: Dict[str, Selector] = {}  # キー: セレクタ名, 値: セレクタ情報
    wait_conditions: Optional[Dict[str, WaitCondition]] = None
    iframe_selector: Optional[str] = None

class PageCreate(PageBase):
    project_id: int

class PageUpdate(PageBase):
    pass

class Page(PageBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PageResponse(Page):
    pass
