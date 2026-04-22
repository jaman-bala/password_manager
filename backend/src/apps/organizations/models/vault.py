from django.db import models
from django.contrib.auth import get_user_model
from apps.organizations.models.organization import Organization

User = get_user_model()


class Vault(models.Model):
    """
    Общий сейф для паролей
    """
    
    name = models.CharField("Название", max_length=255)
    description = models.TextField("Описание", blank=True, null=True)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        verbose_name="Организация",
        related_name="vaults"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Создал",
        related_name="created_vaults"
    )
    created_at = models.DateTimeField("Создано", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлено", auto_now=True)
    
    class Meta:
        db_table = "vaults"
        verbose_name = "Сейф"
        verbose_name_plural = "Сейфы"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.organization.name})"


class VaultAccess(models.Model):
    """
    Доступ к сейфу
    """
    
    class PermissionChoices(models.TextChoices):
        READ = 'read', 'Чтение'
        WRITE = 'write', 'Запись'
        ADMIN = 'admin', 'Администратор'
    
    vault = models.ForeignKey(
        Vault,
        on_delete=models.CASCADE,
        verbose_name="Сейф",
        related_name="access_list"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name="Пользователь",
        related_name="vault_access"
    )
    permission = models.CharField(
        "Права",
        max_length=20,
        choices=PermissionChoices.choices,
        default=PermissionChoices.READ
    )
    granted_at = models.DateTimeField("Предоставлено", auto_now_add=True)
    granted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Кто предоставил",
        related_name="granted_vault_access"
    )
    
    class Meta:
        db_table = "vault_access"
        verbose_name = "Доступ к сейфу"
        verbose_name_plural = "Доступы к сейфам"
        unique_together = ['vault', 'user']
        ordering = ['-granted_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.permission} in {self.vault.name}"
