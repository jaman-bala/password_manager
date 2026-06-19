from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponse, JsonResponse
from django.urls import path
from ninja import NinjaAPI
from ninja.security import django_auth

from apps.product.controllers.views import router as product_router
from apps.product.controllers.folder_views import router as folder_router
from apps.product.controllers.import_export_views import router as import_export_router
from apps.product.controllers.attachment_views import router as attachment_router
from apps.user.controllers.views import router as user_router
from apps.user.controllers.auth_views import router as auth_router
from apps.user.controllers.security_views import router as security_router
from apps.organizations.controllers.views import router as organizations_router
from config.ninja_auth import jwt_auth

from . import settings

def scalar_docs(request):
    html = """<!doctype html>
<html lang="ru">
  <head>
    <title>PasswordManager API</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/openapi.json"
      data-configuration='{
        "theme": "purple",
        "layout": "modern",
        "defaultHttpClient": {"targetKey": "python", "clientKey": "requests"}
      }'
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>"""
    return HttpResponse(html)


api = NinjaAPI(
    title="PasswordManager API",
    version="1.0.0",
    description="API для управления паролями",
    docs_url=None,  # отключаем встроенный Swagger
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

# Security routes
api.add_router(
    "security",  # префикс для безопасности
    security_router,
    tags=["Безопасность"],
)

# Organizations routes
api.add_router(
    "organizations",  # префикс для организаций
    organizations_router,
    tags=["Организации"],
)

# Folder routes
api.add_router(
    "folders",  # префикс для папок
    folder_router,
    tags=["Папки"],
)

# Import/Export routes
api.add_router(
    "import-export",  # префикс для импорта/экспорта
    import_export_router,
    tags=["Импорт/Экспорт"],
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

# Attachment routes (nested under index to keep consistent with product URLs)
api.add_router(
    "index",
    attachment_router,
    tags=["Вложения"],
)

def health_view(request):
    """Простой health check для Docker"""
    return JsonResponse({"status": "healthy"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("docs/", scalar_docs, name="scalar_docs"),
    path("health/", health_view, name="health"),
    path("", api.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
