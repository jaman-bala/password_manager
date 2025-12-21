from functools import wraps
from typing import Any, Callable

from django.http import HttpResponse, HttpResponseForbidden
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import View

from apps.user.enums import PermissionEnum


class AdminPermission(BasePermission):
    """
    Проверяет, есть ли у пользователя разрешение `PermissionEnum.ACCESS_CONTROL`.
    Для небезопасных методов (POST, PATCH, DELETE и т.д.) требуется `admin_permission`.
    Для безопасных методов (GET, HEAD, OPTIONS) разрешен доступ любому аутентифицированному пользователю.
    """

    def has_permission(self, request: Request, view: View) -> bool:
        if request.method == "OPTIONS":
            return True

        user = request.user
        if not user.is_authenticated:
            return False

        return bool(
            user.role
            and user.role.permissions.filter(
                name=PermissionEnum.ACCESS_CONTROL.value
            ).exists()
        )


def admin_required(view_func: Callable[..., Any]) -> Callable[..., HttpResponse]:
    """
    Декоратор, проверяющий наличие административных прав у пользователя.
    """

    @wraps(view_func)
    def _wrapped_view(request: Request, *args: Any, **kwargs: Any) -> HttpResponse:
        if not request.user.is_authenticated or not request.user.is_staff:
            return HttpResponseForbidden(
                "You do not have permission to view this page!"
            )
        return view_func(request, *args, **kwargs)

    return _wrapped_view
