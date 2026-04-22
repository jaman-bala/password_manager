from ninja import Schema
from typing import Optional


class MasterPasswordSetupDTO(Schema):
    """Schema для настройки master password"""
    master_password: str
    confirm_password: str


class MasterPasswordVerifyDTO(Schema):
    """Schema для проверки master password"""
    master_password: str


class TwoFactorSetupDTO(Schema):
    """Schema для настройки 2FA"""
    code: str  # код из приложения для подтверждения


class TwoFactorVerifyDTO(Schema):
    """Schema для проверки 2FA при входе"""
    code: str


class PasswordBreachCheckDTO(Schema):
    """Schema для проверки пароля на утечки"""
    password: str


class PasswordBreachResponseSchema(Schema):
    """Schema для ответа проверки утечек"""
    is_breached: bool
    count: int
