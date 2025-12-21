from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
import time
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware(MiddlewareMixin):
    """
    Middleware для ограничения количества запросов с одного IP
    """
    
    def process_request(self, request):
        # Получаем IP адрес
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        # Настройки rate limiting
        RATE_LIMIT_REQUESTS = 100  # Максимум запросов
        RATE_LIMIT_WINDOW = 60     # За 60 секунд
        
        # Ключ для кеша
        cache_key = f"rate_limit_{ip}"
        
        # Получаем текущее количество запросов
        current_requests = cache.get(cache_key, 0)
        
        if current_requests >= RATE_LIMIT_REQUESTS:
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return JsonResponse({
                'error': 'Слишком много запросов. Попробуйте позже.'
            }, status=429)
        
        # Увеличиваем счетчик
        if current_requests == 0:
            cache.set(cache_key, 1, RATE_LIMIT_WINDOW)
        else:
            cache.set(cache_key, current_requests + 1, RATE_LIMIT_WINDOW)
        
        return None
