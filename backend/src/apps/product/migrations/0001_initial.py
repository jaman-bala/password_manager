# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='CategoryOrm',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True, verbose_name='Name')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created at')),
                ('edited_at', models.DateTimeField(auto_now=True, verbose_name='Edited at')),
            ],
            options={
                'verbose_name': 'Категория',
                'verbose_name_plural': 'Категории',
                'db_table': 'categories',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='ProductOrm',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата добавления')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата последнего обновления')),
                ('title', models.CharField(blank=True, max_length=255, null=True, verbose_name='Название')),
                ('url', models.URLField(blank=True, max_length=500, null=True, verbose_name='URL')),
                ('login', models.CharField(blank=True, max_length=255, null=True, verbose_name='Логин')),
                ('password', models.CharField(blank=True, max_length=255, null=True, verbose_name='Пароль')),
                ('notes', models.TextField(blank=True, null=True, verbose_name='Заметки')),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='product.categoryorm', verbose_name='Категори продукта')),
            ],
            options={
                'verbose_name': 'Продукт',
                'verbose_name_plural': 'Продукты',
                'db_table': 'products',
                'ordering': ['-created_at'],
            },
        ),
    ]
