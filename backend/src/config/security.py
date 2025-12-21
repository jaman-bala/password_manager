import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger(__name__)


class JWTMiddleware(MiddlewareMixin):
    """
    Middleware для проверки JWT токенов на всех API эндпоинтах
    """
    
    def process_request(self, request):
        # Пропускаем статические файлы и админку
        if (request.path.startswith('/static/') or 
            request.path.startswith('/media/') or 
            request.path.startswith('/admin/') or
            request.path.startswith('/health/') or
            request.path == '/'):
            return None
            
        # Пропускаем эндпоинты аутентификации
        if request.path.startswith('/api/auth/'):
            return None
            
        # Для всех остальных API эндпоинтов проверяем токен
        if request.path.startswith('/api/'):
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            
            if not auth_header.startswith('Bearer '):
                logger.warning(f"No Bearer token found for {request.path}")
                return JsonResponse({
                    'error': 'Токен авторизации не предоставлен'
                }, status=401)
                
            try:
                jwt_auth = JWTAuthentication()
                user, token = jwt_auth.authenticate(request)
                if user:
                    request.user = user
                    logger.info(f"User {user.username} authenticated for {request.path}")
                    return None
                else:
                    logger.warning(f"Authentication failed for {request.path}")
                    return JsonResponse({
                        'error': 'Недействительный токен авторизации'
                    }, status=401)
            except (InvalidToken, TokenError) as e:
                logger.warning(f"JWT authentication failed for {request.path}: {str(e)}")
                return JsonResponse({
                    'error': 'Недействительный токен авторизации'
                }, status=401)
            except Exception as e:
                logger.error(f"JWT authentication error for {request.path}: {str(e)}")
                return JsonResponse({
                    'error': 'Ошибка аутентификации'
                }, status=500)
                
        return None