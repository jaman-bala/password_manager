import logging
from typing import Optional, Tuple

from django.conf import settings
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken, Token

logger = logging.getLogger(__name__)


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom authentication class that checks both cookies and the Authorization header.
    With improved debugging to understand authentication failures.
    """

    def authenticate(self, request: Request) -> Optional[Tuple[object, Token]]:
        # First try to get token from Authorization header
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                try:
                    validated_token = self.get_validated_token(raw_token)
                    return self.get_user(validated_token), validated_token
                except Exception as e:
                    logger.warning(f"Header authentication failed: {str(e)}")

        # If no valid header token, try cookies
        access_token = request.COOKIES.get(
            settings.SIMPLE_JWT.get("AUTH_COOKIE", "access_token")
        )
        refresh_token = request.COOKIES.get(
            settings.SIMPLE_JWT.get("AUTH_COOKIE_REFRESH", "refresh_token")
        )

        if not access_token:
            logger.debug("No access token found in cookies")
            return None

        try:
            validated_token = self.get_validated_token(access_token)
            return self.get_user(validated_token), validated_token
        except Exception as e:
            logger.warning(f"Cookie authentication failed: {str(e)}")

        # If access token is invalid, try refresh token
        if refresh_token:
            try:
                refresh = RefreshToken(refresh_token)
                new_access_token: str = str(refresh.access_token)

                # Store the new access token in request for later use
                request.new_access_token = new_access_token

                validated_token = self.get_validated_token(new_access_token)
                return self.get_user(validated_token), validated_token
            except Exception as e:
                logger.error(f"Refresh token authentication failed: {str(e)}")

        return None

    def authenticate_header(self, request: Request) -> str:
        """
        Return a string to be used as the value of the `WWW-Authenticate`
        header in a `401 Unauthenticated` response, or `None` if the
        authentication scheme should return `403 Permission Denied` responses.
        """
        return "Bearer"
