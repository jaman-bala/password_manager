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
from ninja.errors import HttpError

from apps.user.dto.schema import LoginDTO, UserDTO, LoginResponseSchema, LogoutSchema, RefreshTokenSchema

router = Router()

@router.post("/login", response=UserDTO, tags=["Аутентификация"])
def login(request, data: LoginDTO):
    """Вход в систему"""
    user = authenticate(username=data.username, password=data.password)
    
    if user is not None:
        if user.is_active:
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            response = JsonResponse({
                "id": user.id,
                "username": user.username,
                "fio": user.fio,
                "email": user.email,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            })
            
            response.set_cookie(
                'access_token',
                str(access_token),
                httponly=True,
                secure=False,  # В production поменять на True
                samesite='Lax',
                max_age=15 * 60  # 15 минут
            )
            response.set_cookie(
                'refresh_token',
                str(refresh),
                httponly=True,
                secure=False,  # В production поменять на True
                samesite='Lax',
                max_age=7 * 24 * 60 * 60  # 7 дней
            )
            
            return response
        else:
            raise HttpError(400, "Аккаунт деактивирован")
    else:
        raise HttpError(401, "Неверные учетные данные")

@router.post("/refresh", tags=["Аутентификация"])
def refresh_token(request, data: RefreshTokenSchema = None):
    """Обновление токена через httpOnly cookie"""
    try:
        # Сначала пробуем получить из body, затем из cookie
        refresh_token = None
        if data and data.refresh:
            refresh_token = data.refresh
        elif request.COOKIES.get('refresh_token'):
            refresh_token = request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            raise HttpError(400, "Refresh token не предоставлен")
            
        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)
        
        new_access = serializer.validated_data["access"]
        
        # Создаем ответ с новым access токеном в куке
        response = JsonResponse({"success": True})
        response.set_cookie(
            'access_token',
            new_access,
            httponly=True,
            secure=False,
            samesite='Lax',
            max_age=15 * 60  # 15 минут
        )
        
        return response
    except (InvalidToken, TokenError) as e:
        raise HttpError(401, "Недействительный refresh token")
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, "Ошибка обновления токена")

@router.post("/logout", tags=["Аутентификация"])
def logout(request, data: LogoutSchema = None):
    """Выход из системы с очисткой cookies"""
    try:
        # Получаем refresh token из body или куки
        refresh_token = None
        if data and data.refresh:
            refresh_token = data.refresh
        elif request.COOKIES.get('refresh_token'):
            refresh_token = request.COOKIES.get('refresh_token')
        
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        # Создаем ответ и удаляем куки
        response = JsonResponse({"message": "Успешный выход из системы"})
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        
        return response
    except Exception as e:
        # Все равно удаляем куки даже если токен уже в блэклисте
        response = JsonResponse({"message": "Успешный выход из системы"})
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response

@router.get("/me", response=UserDTO, tags=["Аутентификация"], auth=jwt_auth)
def get_current_user(request):
    """Получить информацию о текущем пользователе"""
    return request.user
