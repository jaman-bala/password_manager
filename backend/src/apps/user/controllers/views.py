from django.contrib.auth import authenticate
from apps.user.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ninja import Router
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from apps.user.dto.schema import (
    LoginResponseSchema,
    LoginResponseSchema, 
    TokenVerifySchema, 
    TokenVerifyResponseSchema,
    UserResponseSchema
)


router = Router()


@router.post("/login", tags=["Аутентификация"])
@csrf_exempt
def login_user(request):
    """Вход в систему - аутентификация пользователя"""
    try:
        # Получаем данные из POST запроса
        data = request.POST
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return {
                "success": False, 
                "message": "Username and password are required"
            }

        # Rate limiting check (basic implementation)
        if hasattr(request, "session"):
            login_attempts = request.session.get("login_attempts", 0)
            if login_attempts >= 5:
                return {
                    "success": False,
                    "message": "Too many login attempts. Please try again later.",
                }

        user = authenticate(username=username, password=password)

        if user is not None:
            if user.is_active:
                # Generate JWT tokens using SimpleJWT
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)

                # Reset login attempts on successful login
                if hasattr(request, "session"):
                    request.session["login_attempts"] = 0

                return {
                    "success": True,
                    "message": "Login successful",
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                }
            else:
                return {
                    "success": False, 
                    "message": "Account is disabled"
                }
        else:
            # Increment login attempts
            if hasattr(request, "session"):
                request.session["login_attempts"] = (
                    request.session.get("login_attempts", 0) + 1
                )

            return {
                "success": False, 
                "message": "Invalid username or password"
            }

    except Exception as e:
        return {
            "success": False, 
            "message": f"Error during login: {str(e)}"
        }


@router.post("/verify-token", response=TokenVerifyResponseSchema, tags=["Аутентификация"])
@csrf_exempt
def verify_token(request, payload: TokenVerifySchema):
    """Проверка валидности JWT токена"""
    try:
        token = payload.token

        if not token:
            return {
                "success": False, 
                "message": "Token is required"
            }

        # Use SimpleJWT to verify token
        jwt_auth = JWTAuthentication()
        try:
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            
            if user.is_active:
                return {
                    "success": True,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                    },
                }
        except (InvalidToken, TokenError):
            pass

        return {
            "success": False, 
            "message": "Invalid or expired token"
        }

    except Exception as e:
        return {
            "success": False, 
            "message": f"Error verifying token: {str(e)}"
        }


@router.get("/profile", response=UserResponseSchema, tags=["Пользователь"])
def get_user_profile(request):
    """Получить профиль текущего пользователя (требует аутентификации)"""
    # This would need authentication middleware
    # For now, return basic user info if available
    if hasattr(request, 'user') and request.user.is_authenticated:
        return {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
        }
    return None
