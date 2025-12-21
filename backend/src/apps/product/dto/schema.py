from typing import Optional
from datetime import datetime
from ninja import Schema



class CategoryDTO(Schema):
    id: int
    name: str
    
    class Config:
        from_attributes = True


class ProductDTO(Schema):
    id: int
    category: Optional[CategoryDTO] = None
    title: Optional[str] = None
    url: Optional[str] = None
    login: Optional[str] = None
    password: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProductCreateDTO(Schema):
    category_id: Optional[int] = None
    title: Optional[str] = None
    url: Optional[str] = None
    login: Optional[str] = None
    password: Optional[str] = None
    notes: Optional[str] = None