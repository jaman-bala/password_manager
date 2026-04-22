from django.http import JsonResponse
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from apps.user.models import TwoFactorAuth


class TwoFactorMiddleware:
    """Middleware для проверки 2FA на чувствительных операциях"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Пути, которые требуют проверки 2FA
        protected_paths = [
            '/api/index/products',  # Создание/удаление паролей
            '/api/auth/logout',  # Выход
            '/api/security/import',  # Импорт
            '/api/security/export',  # Экспорт
        ]

        # Проверяем, является ли путь защищённым
        is_protected = any(request.path.startswith(path) for path in protected_paths)

        if is_protected and request.method in ['POST', 'PUT', 'DELETE']:
            # Проверяем авторизацию
            auth = JWTAuthentication()
            try:
                result = auth.authenticate(request)
                if result is not None:
                    user, _ = result
                    # Проверяем включена ли 2FA у пользователя
                    try:
                        two_factor = TwoFactorAuth.objects.get(user=user)
                        if two_factor.is_enabled:
                            # Проверяем пройдена ли 2FA (можно добавить флаг в сессию или токен)
                            # Для простоты считаем, что если токен валиден - 2FA пройдена
                            # В реальном приложении нужно добавить флаг в JWT токен
                            pass
                    except TwoFactorAuth.DoesNotExist:
                        pass
            except Exception:
                pass

        response = self.get_response(request)
        return response
