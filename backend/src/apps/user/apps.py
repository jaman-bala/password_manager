from django.apps import AppConfig


class UserConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.user"
    verbose_name = "Пользователь"
    
    def ready(self):
        # Импортируем админку при запуске приложения
        from . import admin