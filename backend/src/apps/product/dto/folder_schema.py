from ninja import Schema
from typing import Optional
from datetime import datetime


class FolderCreateDTO(Schema):
    """Schema для создания папки"""
    name: str
    parent_id: Optional[int] = None
    organization_id: Optional[int] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class FolderDTO(Schema):
    """Schema для папки"""
    id: int
    name: str
    parent_id: Optional[int] = None
    user_id: Optional[int] = None
    organization_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    icon: Optional[str] = None
    color: Optional[str] = None
    full_path: Optional[str] = None
    
    class Config:
        from_attributes = True
