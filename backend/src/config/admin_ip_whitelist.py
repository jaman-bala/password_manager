import logging
from django.http import HttpResponseForbidden
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class AdminIPWhitelistMiddleware(MiddlewareMixin):
    """
    Middleware для ограничения доступа к админке по IP whitelist
    """
    
    def process_request(self, request):
        # Проверяем только для админки
        if not request.path.startswith('/admin/'):
            return None
        
        # Если whitelist пуст - разрешаем всем
        whitelist = getattr(settings, 'ADMIN_IP_WHITELIST', [])
        if not whitelist:
            return None
        
        # Получаем IP клиента
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            client_ip = x_forwarded_for.split(',')[0].strip()
        else:
            client_ip = request.META.get('REMOTE_ADDR')
        
        # Проверяем IP в whitelist
        if client_ip not in whitelist:
            logger.warning(f"Admin access denied for IP: {client_ip}")
            return HttpResponseForbidden(
                "Access denied. Your IP is not whitelisted for admin access."
            )
        
        logger.info(f"Admin access allowed for IP: {client_ip}")
        return None
