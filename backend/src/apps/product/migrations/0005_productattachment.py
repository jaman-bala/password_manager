from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0004_auto_20260422_1148'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductAttachment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='attachments/%Y/%m/', verbose_name='Файл')),
                ('filename', models.CharField(max_length=255, verbose_name='Имя файла')),
                ('content_type', models.CharField(max_length=100, verbose_name='Тип файла')),
                ('size', models.PositiveIntegerField(verbose_name='Размер (байт)')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True, verbose_name='Загружено')),
                ('product', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='attachments',
                    to='product.productorm',
                    verbose_name='Запись',
                )),
            ],
            options={
                'verbose_name': 'Вложение',
                'verbose_name_plural': 'Вложения',
                'db_table': 'product_attachments',
                'ordering': ['uploaded_at'],
            },
        ),
    ]