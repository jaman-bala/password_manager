from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path
from ninja import NinjaAPI
from ninja.security import django_auth

from apps.product.controllers.views import router as product_router
from apps.user.controllers.views import router as user_router
from apps.user.controllers.auth_views import router as auth_router
from config.ninja_auth import jwt_auth

from . import settings

# Создаем API с правильной OpenAPI конфигурацией
api = NinjaAPI(
    title="PasswordManager API",
    version="1.0.0",
    description="API для управления паролями",
    # Убираем глобальную аутентификацию, будем добавлять на каждый эндпоинт
)

@api.get("/health", tags=["Система"])
def health_check(request):
    """Проверка состояния сервиса для Docker health checks"""
    return JsonResponse({"status": "healthy", "service": "password-backend"})


# Authentication routes (без аутентификации)
api.add_router(
    "auth",  # префикс для аутентификации
    auth_router,
    tags=["Аутентификация"],
    auth=None,  # Отключаем аутентификацию для эндпоинтов входа
)

# User routes
api.add_router(
    "user",  # префикс для пользователей
    user_router,
    tags=["Пользователи"],
)

# Product routes
api.add_router(
    "index",  # префикс для продуктов
    product_router,
    tags=["Главная страница"],
)

def health_view(request):
    """Простой health check для Docker"""
    return JsonResponse({"status": "healthy"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_view, name="health"),
    path("", api.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
