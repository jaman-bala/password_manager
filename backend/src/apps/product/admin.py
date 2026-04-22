from django.contrib import admin
from unfold.admin import ModelAdmin
from .models.models import ProductOrm, CategoryOrm
from .models.folder import Folder
from .models.password_history import PasswordHistory



@admin.register(ProductOrm)
class ProductAdmin(ModelAdmin):
    list_display = ('title', 'category', 'url', 'login', 'created_at')
    list_filter = ('category', 'created_at')
    search_fields = ('title', 'url', 'login', 'notes')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    
    # Настройки для работы с паролями
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'category', 'url')
        }),
        ('Данные для входа', {
            'fields': ('login', 'password')
        }),
        ('Дополнительно', {
            'fields': ('notes',)
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CategoryOrm)
class CategoryAdmin(ModelAdmin):
    list_display = ('name', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name',)
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)


@admin.register(Folder)
class FolderAdmin(ModelAdmin):
    list_display = ('name', 'parent', 'created_at')
    list_filter = ('parent', 'created_at')
    search_fields = ('name',)
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)


@admin.register(PasswordHistory)
class PasswordHistoryAdmin(ModelAdmin):
    list_display = ('product', 'changed_at', 'changed_by')
    list_filter = ('changed_at',)
    search_fields = ('product__title',)
    ordering = ('-changed_at',)
    readonly_fields = ('changed_at',)
