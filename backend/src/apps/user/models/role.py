from django.db import models


class Role(models.Model):
    """Role model for user permissions"""
    
    name = models.CharField("Название роли", max_length=100, unique=True)
    description = models.TextField("Описание", blank=True, null=True)
    permissions = models.JSONField("Права доступа", default=list, blank=True)
    is_active = models.BooleanField("Активна", default=True)
    created_at = models.DateTimeField("Создано", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлено", auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Роль"
        verbose_name_plural = "Роли"
        ordering = ['name']
