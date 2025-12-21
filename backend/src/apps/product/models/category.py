from django.db import models
from django.utils.translation import gettext_lazy as _


class CategoryOrm(models.Model):
    """
    Представляет категорию.
    """

    name = models.CharField(max_length=255, unique=True, verbose_name=_("Name"))
    created_at: models.DateTimeField = models.DateTimeField(
        auto_now_add=True, verbose_name=_("Created at")
    )
    edited_at: models.DateTimeField = models.DateTimeField(
        auto_now=True, verbose_name=_("Edited at")
    )

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"CategoryModel(id={self.id}, name={self.name})"

    class Meta:
        db_table = "categories"
        verbose_name = _("Категория")
        verbose_name_plural = _("Категории")
        ordering = ['name']
