from ninja import Schema
from typing import Optional


class LoginDTO(Schema):
    """Schema for user login"""
    username: str
    password: str


class UserDTO(Schema):
    """Schema for user response"""
    id: int
    username: str
    email: Optional[str] = None
    fio: Optional[str] = None
    is_staff: bool
    is_superuser: bool

class UserResponseSchema(Schema):
    """Schema for user response"""
    id: int
    username: str
    email: Optional[str] = None


class UserProfileSchema(Schema):
    """Schema for user profile"""

    phone: str = None
    birth_date: str = None
    address: str = None
    created_at: str
    updated_at: str


class LoginResponseSchema(Schema):
    """Schema for login response"""
    access: str
    refresh: str
    user: UserDTO


class TokenVerifySchema(Schema):
    """Schema for token verification"""

    token: str


class TokenVerifyResponseSchema(Schema):
    """Schema for token verification response"""

    success: bool
    user: UserResponseSchema = None
    message: str = None


class LogoutSchema(Schema):
    """Schema for logout request"""
    refresh: str

class RefreshTokenSchema(Schema):
    """Schema for token refresh request"""
    refresh: str
