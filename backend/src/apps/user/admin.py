from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from .models import User

# Регистрируем нашу кастомную админку для пользователей
@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    """Кастомная админка для пользователей с unfold стилем"""
    
    list_display = ('username', 'fio', 'email', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'fio', 'email')
    ordering = ('-id',)
    
    # Поля для отображения в форме редактирования
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Персональная информация', {'fields': ('fio', 'email', 'profile_image')}),
        ('Права доступа', {
            'fields': ('is_active', 'is_staff', 'is_superuser'),
            'classes': ('collapse',)
        }),
        ('Дополнительно', {
            'fields': ('groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
    )
    
    # Поля для формы добавления пользователя
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2'),
        }),
        ('Персональная информация', {
            'classes': ('wide',),
            'fields': ('fio', 'email'),
        }),
        ('Права доступа', {
            'classes': ('wide', 'collapse'),
            'fields': ('is_active', 'is_staff', 'is_superuser'),
        }),
    )
    
    readonly_fields = ('last_login', 'date_joined')
