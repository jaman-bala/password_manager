from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model

User = get_user_model()


class Folder(models.Model):
    """
    Папка для древовидной структуры
    """
    
    name = models.CharField("Название", max_length=255)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Родительская папка",
        related_name="children"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name="Пользователь",
        related_name="folders",
        null=True,
        blank=True
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        verbose_name="Организация",
        related_name="folders",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField("Создано", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлено", auto_now=True)
    icon = models.CharField("Иконка", max_length=50, blank=True, null=True)
    color = models.CharField("Цвет", max_length=7, blank=True, null=True)  # hex color
    
    class Meta:
        db_table = "folders"
        verbose_name = _("Папка")
        verbose_name_plural = _("Папки")
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def get_full_path(self):
        """Возвращает полный путь папки"""
        path = [self.name]
        parent = self.parent
        while parent:
            path.insert(0, parent.name)
            parent = parent.parent
        return " / ".join(path)
