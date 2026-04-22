from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class TwoFactorAuth(models.Model):
    """
    Двухфакторная аутентификация (TOTP)
    """
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        verbose_name="Пользователь",
        related_name="two_factor_auth"
    )
    secret_key = models.CharField("Секретный ключ", max_length=255, blank=True, null=True)
    is_enabled = models.BooleanField("Включена", default=False)
    backup_codes = models.JSONField("Резервные коды", default=list, blank=True)
    created_at = models.DateTimeField("Создано", auto_now_add=True)
    last_used = models.DateTimeField("Последнее использование", null=True, blank=True)
    
    class Meta:
        db_table = "two_factor_auth"
        verbose_name = "Двухфакторная аутентификация"
        verbose_name_plural = "Двухфакторные аутентификации"
    
    def __str__(self):
        return f"2FA for {self.user.username}"
