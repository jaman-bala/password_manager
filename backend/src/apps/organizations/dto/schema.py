from ninja import Schema
from typing import Optional
from datetime import datetime


class OrganizationCreateDTO(Schema):
    """Schema для создания организации"""
    name: str
    description: Optional[str] = None


class OrganizationDTO(Schema):
    """Schema для организации"""
    id: int
    name: str
    description: Optional[str] = None
    owner_id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


class OrganizationMemberDTO(Schema):
    """Schema для члена организации"""
    id: int
    user_id: int
    username: str
    role: str
    joined_at: datetime
    
    class Config:
        from_attributes = True


class VaultCreateDTO(Schema):
    """Schema для создания сейфа"""
    name: str
    description: Optional[str] = None
    organization_id: int


class VaultDTO(Schema):
    """Schema для сейфа"""
    id: int
    name: str
    description: Optional[str] = None
    organization_id: int
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class VaultAccessDTO(Schema):
    """Schema для доступа к сейфу"""
    id: int
    vault_id: int
    user_id: int
    username: str
    permission: str
    granted_at: datetime
    
    class Config:
        from_attributes = True


class VaultGrantAccessDTO(Schema):
    """Schema для предоставления доступа к сейфу"""
    user_id: int
    permission: str  # read, write, admin
