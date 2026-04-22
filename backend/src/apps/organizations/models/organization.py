from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Organization(models.Model):
    """
    Организация для совместной работы
    """
    
    name = models.CharField("Название", max_length=255)
    description = models.TextField("Описание", blank=True, null=True)
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name="Владелец",
        related_name="owned_organizations"
    )
    created_at = models.DateTimeField("Создано", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлено", auto_now=True)
    is_active = models.BooleanField("Активна", default=True)
    
    class Meta:
        db_table = "organizations"
        verbose_name = "Организация"
        verbose_name_plural = "Организации"
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class OrganizationMember(models.Model):
    """
    Член организации с ролью
    """
    
    class RoleChoices(models.TextChoices):
        ADMIN = 'admin', 'Администратор'
        MEMBER = 'member', 'Участник'
        VIEWER = 'viewer', 'Зритель'
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        verbose_name="Организация",
        related_name="members"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name="Пользователь",
        related_name="organizations"
    )
    role = models.CharField(
        "Роль",
        max_length=20,
        choices=RoleChoices.choices,
        default=RoleChoices.MEMBER
    )
    joined_at = models.DateTimeField("Присоединился", auto_now_add=True)
    
    class Meta:
        db_table = "organization_members"
        verbose_name = "Член организации"
        verbose_name_plural = "Члены организации"
        unique_together = ['organization', 'user']
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.role} in {self.organization.name}"
