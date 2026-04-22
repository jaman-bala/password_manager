import logging
import pyotp
import qrcode
import io
import base64
from ninja import Router
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from config.encryption import EncryptionService
from config.breach_monitoring import BreachMonitoringService
from apps.user.dto.security_schema import (
    MasterPasswordSetupDTO,
    MasterPasswordVerifyDTO,
    TwoFactorSetupDTO,
    TwoFactorVerifyDTO,
    PasswordBreachCheckDTO,
    PasswordBreachResponseSchema
)
from apps.user.models import TwoFactorAuth
from config.ninja_auth import jwt_auth

logger = logging.getLogger(__name__)
User = get_user_model()

router = Router()


@router.post("/master-password/setup", tags=["Безопасность"], auth=jwt_auth)
def setup_master_password(request, data: MasterPasswordSetupDTO):
    """Настройка master password для шифрования"""
    user = request.user
    
    if data.master_password != data.confirm_password:
        return JsonResponse({"error": "Пароли не совпадают"}, status=400)
    
    if len(data.master_password) < 8:
        return JsonResponse({"error": "Мастер-пароль должен быть минимум 8 символов"}, status=400)
    
    # Проверяем, не установлен ли уже master password
    if user.master_password_enabled:
        return JsonResponse({"error": "Мастер-пароль уже установлен"}, status=400)
    
    # Сохраняем хеш master password
    user.master_password_hash = EncryptionService.hash_master_password(data.master_password)
    user.master_password_enabled = True
    user.save()
    
    # Шифруем все существующие пароли пользователя
    from apps.product.models import ProductOrm
    products = ProductOrm.objects.filter(user=user)
    
    for product in products:
        if product.password and not product.is_encrypted:
            encrypted, salt = EncryptionService.encrypt_password(product.password, data.master_password)
            product.password = encrypted
            product.password_salt = salt
            product.is_encrypted = True
            product.save()
    
    return JsonResponse({"success": True, "message": "Мастер-пароль установлен. Все пароли зашифрованы."})


@router.post("/master-password/verify", tags=["Безопасность"], auth=jwt_auth)
def verify_master_password(request, data: MasterPasswordVerifyDTO):
    """Проверка master password (для расшифровки)"""
    user = request.user
    
    if not user.master_password_enabled:
        return JsonResponse({"error": "Мастер-пароль не установлен"}, status=400)
    
    if EncryptionService.verify_master_password(data.master_password, user.master_password_hash):
        return JsonResponse({"success": True, "verified": True})
    else:
        return JsonResponse({"success": False, "verified": False}, status=400)


@router.post("/2fa/setup", tags=["Безопасность"], auth=jwt_auth)
def setup_two_factor(request):
    """Начало настройки 2FA - возвращает QR код"""
    user = request.user
    
    # Получаем или создаём запись 2FA
    two_factor, created = TwoFactorAuth.objects.get_or_create(user=user)
    
    if two_factor.is_enabled:
        return JsonResponse({"error": "2FA уже включена"}, status=400)
    
    # Генерируем секретный ключ
    secret = pyotp.random_base32()
    two_factor.secret_key = secret
    two_factor.save()
    
    # Создаём QR код
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=user.email or user.username,
        issuer_name="Password Manager"
    )
    
    qr = qrcode.make(provisioning_uri)
    img_buffer = io.BytesIO()
    qr.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    qr_base64 = base64.b64encode(img_buffer.getvalue()).decode()
    
    return JsonResponse({
        "success": True,
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_base64}"
    })


@router.post("/2fa/enable", tags=["Безопасность"], auth=jwt_auth)
def enable_two_factor(request, data: TwoFactorSetupDTO):
    """Подтверждение и включение 2FA"""
    user = request.user
    
    try:
        two_factor = TwoFactorAuth.objects.get(user=user)
    except TwoFactorAuth.DoesNotExist:
        return JsonResponse({"error": "Сначала настройте 2FA"}, status=400)
    
    if two_factor.is_enabled:
        return JsonResponse({"error": "2FA уже включена"}, status=400)
    
    # Проверяем код
    totp = pyotp.TOTP(two_factor.secret_key)
    if not totp.verify(data.code):
        return JsonResponse({"error": "Неверный код"}, status=400)
    
    # Генерируем резервные коды
    backup_codes = [pyotp.random_base32()[:8] for _ in range(10)]
    two_factor.backup_codes = backup_codes
    two_factor.is_enabled = True
    two_factor.save()
    
    return JsonResponse({
        "success": True,
        "message": "2FA включена",
        "backup_codes": backup_codes
    })


@router.post("/2fa/disable", tags=["Безопасность"], auth=jwt_auth)
def disable_two_factor(request, data: TwoFactorVerifyDTO):
    """Отключение 2FA (требует код подтверждения)"""
    user = request.user
    
    try:
        two_factor = TwoFactorAuth.objects.get(user=user)
    except TwoFactorAuth.DoesNotExist:
        return JsonResponse({"error": "2FA не настроена"}, status=400)
    
    if not two_factor.is_enabled:
        return JsonResponse({"error": "2FA уже отключена"}, status=400)
    
    # Проверяем код
    totp = pyotp.TOTP(two_factor.secret_key)
    if not totp.verify(data.code):
        return JsonResponse({"error": "Неверный код"}, status=400)
    
    two_factor.is_enabled = False
    two_factor.secret_key = None
    two_factor.backup_codes = []
    two_factor.save()
    
    return JsonResponse({"success": True, "message": "2FA отключена"})


@router.post("/2fa/status", tags=["Безопасность"], auth=jwt_auth)
def two_factor_status(request):
    """Статус 2FA пользователя"""
    user = request.user
    
    try:
        two_factor = TwoFactorAuth.objects.get(user=user)
        return JsonResponse({
            "enabled": two_factor.is_enabled,
            "has_backup_codes": bool(two_factor.backup_codes)
        })
    except TwoFactorAuth.DoesNotExist:
        return JsonResponse({"enabled": False, "has_backup_codes": False})


@router.post("/check-breach", response=PasswordBreachResponseSchema, tags=["Безопасность"])
def check_password_breach(request, data: PasswordBreachCheckDTO):
    """Проверка пароля на утечки"""
    is_breached, count = BreachMonitoringService.check_password_breach(data.password)
    
    return {
        "is_breached": is_breached,
        "count": count
    }
