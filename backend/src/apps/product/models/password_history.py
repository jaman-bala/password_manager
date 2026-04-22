from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model

User = get_user_model()


class PasswordHistory(models.Model):
    """
    История изменений паролей для предотвращения повторного использования
    """
    
    product = models.ForeignKey(
        'product.ProductOrm',
        on_delete=models.CASCADE,
        verbose_name="Продукт",
        related_name="password_history"
    )
    password_hash = models.CharField("Хеш пароля", max_length=255)
    changed_at = models.DateTimeField("Дата изменения", auto_now_add=True)
    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Кто изменил"
    )
    
    class Meta:
        db_table = "password_history"
        verbose_name = _("История пароля")
        verbose_name_plural = _("Истории паролей")
        ordering = ['-changed_at']
    
    def __str__(self):
        return f"Password history for {self.product.title} at {self.changed_at}"
