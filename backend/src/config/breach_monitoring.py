import hashlib
import requests
import logging

logger = logging.getLogger(__name__)


class BreachMonitoringService:
    """
    Сервис для проверки паролей в базах утечек (Have I Been Pwned)
    """
    
    HIBP_API_URL = "https://api.pwnedpasswords.com/range/"
    
    @staticmethod
    def check_password_breach(password: str) -> tuple[bool, int]:
        """
        Проверяет, был ли пароль в утечках
        
        Args:
            password: пароль для проверки
            
        Returns:
            (is_breached, count) - был ли в утечках и количество раз
        """
        try:
            # Создаём SHA1 хеш пароля
            sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
            prefix, suffix = sha1_hash[:5], sha1_hash[5:]
            
            # Запрашиваем у HIBP все хеши с этим префиксом (k-anonymity)
            response = requests.get(f"{BreachMonitoringService.HIBP_API_URL}{prefix}", timeout=5)
            response.raise_for_status()
            
            # Ищем наш суффикс в ответе
            hashes = response.text.split()
            for hash_count in hashes:
                hash_suffix, count = hash_count.split(':')
                if hash_suffix == suffix:
                    return True, int(count)
            
            return False, 0
            
        except requests.RequestException as e:
            logger.error(f"Error checking password breach: {e}")
            # В случае ошибки API не блокируем пароль
            return False, 0
    
    @staticmethod
    def check_email_breach(email: str) -> dict:
        """
        Проверяет, был ли email в утечках (требуется API key)
        
        Args:
            email: email для проверки
            
        Returns:
            dict с информацией об утечках
        """
        # Для этой функции нужен HIBP API key
        # Можно добавить позже
        return {"breaches": []}
