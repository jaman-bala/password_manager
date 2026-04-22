from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model

from apps.product.models.category import CategoryOrm

User = get_user_model()


class ProductOrm(models.Model):
    """
    Модель продукта
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name="Пользователь",
        related_name="products",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Дата последнего обновления"
    )
    category = models.ForeignKey(
        CategoryOrm,
        on_delete=models.CASCADE,
        verbose_name="Категори продукта",
        blank=True,
        null=True,
    )

    # Папка для организации (древовидная структура)
    folder = models.ForeignKey(
        'Folder',
        on_delete=models.SET_NULL,
        verbose_name="Папка",
        blank=True,
        null=True,
        related_name='passwords'
    )

    # Сейф для командной работы
    vault = models.ForeignKey(
        'organizations.Vault',
        on_delete=models.SET_NULL,
        verbose_name="Сейф",
        blank=True,
        null=True,
        related_name='passwords'
    )

    title = models.CharField(max_length=255, verbose_name="Название", blank=True, null=True)
    url = models.URLField(max_length=500, verbose_name="URL", blank=True, null=True)
    login = models.CharField(max_length=255, verbose_name="Логин", blank=True, null=True)
    
    # Зашифрованный пароль и соль
    password = models.CharField(max_length=500, verbose_name="Зашифрованный пароль", blank=True, null=True)
    password_salt = models.CharField(max_length=255, verbose_name="Соль для шифрования", blank=True, null=True)
    
    notes = models.TextField(verbose_name="Заметки", blank=True, null=True)
    
    # Для обратной совместимости - флаг шифрования
    is_encrypted = models.BooleanField("Зашифрован", default=False)


    def __str__(self):
        return self.title or f"Product {self.pk}"

    class Meta:
        db_table = "products"
        verbose_name = _("Продукт")
        verbose_name_plural = _("Продукты")
        ordering = ['-created_at']
