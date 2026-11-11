from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed

class JWTCookieAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that extracts the token first from HttpOnly cookies,
    falling back to the standard Authorization Bearer header.
    """

    def authenticate(self, request):
        # 1. Check HttpOnly cookie
        cookie_name = getattr(settings, 'JWT_COOKIE_NAME', 'access_token')
        raw_token = request.COOKIES.get(cookie_name)

        # 2. Fall back to standard Authorization header
        if not raw_token:
            header = self.get_header(request)
            if header is not None:
                raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, AuthenticationFailed):
            return None
