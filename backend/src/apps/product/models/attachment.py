from django.db import models
from django.utils.translation import gettext_lazy as _


class ProductAttachment(models.Model):
    product = models.ForeignKey(
        'ProductOrm',
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name=_('Запись'),
    )
    file = models.FileField(upload_to='attachments/%Y/%m/', verbose_name=_('Файл'))
    filename = models.CharField(max_length=255, verbose_name=_('Имя файла'))
    content_type = models.CharField(max_length=100, verbose_name=_('Тип файла'))
    size = models.PositiveIntegerField(verbose_name=_('Размер (байт)'))
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Загружено'))

    class Meta:
        db_table = 'product_attachments'
        verbose_name = _('Вложение')
        verbose_name_plural = _('Вложения')
        ordering = ['uploaded_at']

    def __str__(self) -> str:
        return self.filename