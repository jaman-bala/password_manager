from ninja import Schema
from typing import Optional, List


class ExportFormatDTO(Schema):
    """Schema для формата экспорта"""
    format: str  # json, csv


class ImportDataDTO(Schema):
    """Schema для импорта данных"""
    data: str  # JSON или CSV строка
    format: str  # json, csv
    master_password: Optional[str] = None  # для расшифровки при импорте


class ExportResponseSchema(Schema):
    """Schema для ответа экспорта"""
    data: str
    format: str
    count: int
