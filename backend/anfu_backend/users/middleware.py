# users/middleware.py
import jwt
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    def __call__(self, scope):
        return JWTAuthMiddlewareInstance(scope, self.inner)

class JWTAuthMiddlewareInstance:
    def __init__(self, scope, inner):
        self.scope = dict(scope)
        self.inner = inner

    async def __call__(self, receive, send):
        query_string = self.scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)

        token = query_params.get("token", [None])[0]

        if token:
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = payload.get("user_id")
                if user_id:
                    self.scope["user"] = await self.get_user(user_id)
                else:
                    self.scope["user"] = AnonymousUser()
            except Exception as e:
                print("JWT decode error:", e)
                self.scope["user"] = AnonymousUser()
        else:
            self.scope["user"] = AnonymousUser()

        return await self.inner(self.scope, receive, send)

    @staticmethod
    async def get_user(user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()
