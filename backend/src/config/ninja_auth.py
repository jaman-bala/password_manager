from ninja.security import HttpBearer
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class JWTAuth(HttpBearer):
    """
    JWT Authentication для Django Ninja
    """
    
    def authenticate(self, request, token):
        try:
            # Валидируем токен
            access_token = AccessToken(token)
            user_id = access_token.get('user_id')
            
            if not user_id:
                return None
                
            # Получаем пользователя
            user = User.objects.get(id=user_id)
            
            if user and user.is_active:
                request.user = user
                return user
            else:
                return None
                
        except (InvalidToken, TokenError):
            return None
        except User.DoesNotExist:
            return None
        except Exception:
            return None


# Создаем экземпляр для использования
jwt_auth = JWTAuth()
