from django.contrib import admin
from unfold.admin import ModelAdmin
from .models.models import ProductOrm, CategoryOrm



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
