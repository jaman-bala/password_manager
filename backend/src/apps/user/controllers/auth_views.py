from ninja import Router
from ninja.security import django_auth
from django.contrib.auth import authenticate
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json
from config.ninja_auth import jwt_auth

from apps.user.dto.schema import LoginDTO, UserDTO, LoginResponseSchema, LogoutSchema

router = Router()

@router.post("/login", response=LoginResponseSchema, tags=["Аутентификация"])
def login(request, data: LoginDTO):
    """Вход в систему"""
    user = authenticate(username=data.username, password=data.password)
    
    if user is not None:
        if user.is_active:
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            return {
                "access": str(access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "fio": user.fio,
                    "email": user.email,
                    "is_staff": user.is_staff,
                    "is_superuser": user.is_superuser,
                }
            }
        else:
            return {"error": "Аккаунт деактивирован"}, 400
    else:
        return {"error": "Неверные учетные данные"}, 401

@router.post("/refresh", tags=["Аутентификация"])
def refresh_token(request, data: dict):
    """Обновление токена"""
    try:
        refresh_token = data.get("refresh")
        if not refresh_token:
            return {"error": "Refresh token не предоставлен"}, 400
            
        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)
        
        return {
            "access": serializer.validated_data["access"]
        }
    except (InvalidToken, TokenError) as e:
        return {"error": "Недействительный refresh token"}, 401
    except Exception as e:
        return {"error": "Ошибка обновления токена"}, 500

@router.post("/logout", tags=["Аутентификация"])
def logout(request, data: LogoutSchema):
    """Выход из системы"""
    try:
        refresh_token = data.refresh
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return {"message": "Успешный выход из системы"}
    except Exception as e:
        return {"error": "Ошибка выхода из системы"}, 500

@router.get("/me", response=UserDTO, tags=["Аутентификация"], auth=jwt_auth)
def get_current_user(request):
    """Получить информацию о текущем пользователе"""
    return request.user
