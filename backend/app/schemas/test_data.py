from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field
from app.models.test_data import DataFormat

class Variable(BaseModel):
    name: str
    value: Any
    description: Optional[str] = None

class TestDataBase(BaseModel):
    name: str
    description: Optional[str] = None
    format: DataFormat = DataFormat.JSON
    data: Union[Dict[str, Any], List[Dict[str, Any]]]  # JSON形式のデータ
    variables: Optional[Dict[str, Variable]] = None

class TestDataCreate(TestDataBase):
    project_id: int

class TestDataUpdate(TestDataBase):
    pass

class TestDataImport(BaseModel):
    name: str
    description: Optional[str] = None
    format: DataFormat
    file_content: str  # Base64エンコードされたファイル内容

class TestData(TestDataBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TestDataWithTestCases(TestData):
    test_cases: List["TestCase"] = []  # 循環参照を避けるため文字列で指定 