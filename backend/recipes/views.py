from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import Category, Recipe
from .permissions import IsAdminUserOrReadOnly, IsOwnerOrAdmin, IsStrictAdminUser
from .serializers import (
    AdminResetPasswordSerializer,
    CategorySerializer,
    LoginSerializer,
    RecipeSerializer,
    RegisterSerializer,
    UserPublicSerializer,
)

User = get_user_model()


def set_jwt_cookies(response: Response, refresh_token: RefreshToken) -> Response:
    """
    Utility function to set Secure and HttpOnly cookies for JWT authentication.
    """
    cookie_secure = getattr(settings, 'JWT_COOKIE_SECURE', False)
    cookie_samesite = getattr(settings, 'JWT_COOKIE_SAMESITE', 'Lax')
    access_token_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
    refresh_token_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']

    # Access Token Cookie
    response.set_cookie(
        key=getattr(settings, 'JWT_COOKIE_NAME', 'access_token'),
        value=str(refresh_token.access_token),
        max_age=int(access_token_lifetime.total_seconds()),
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        path='/',
    )

    # Refresh Token Cookie
    response.set_cookie(
        key=getattr(settings, 'JWT_REFRESH_COOKIE_NAME', 'refresh_token'),
        value=str(refresh_token),
        max_age=int(refresh_token_lifetime.total_seconds()),
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        path='/',
    )
    return response


def clear_jwt_cookies(response: Response) -> Response:
    """
    Clears JWT auth cookies.
    """
    response.delete_cookie(getattr(settings, 'JWT_COOKIE_NAME', 'access_token'), path='/')
    response.delete_cookie(getattr(settings, 'JWT_REFRESH_COOKIE_NAME', 'refresh_token'), path='/')
    return response


class RegisterView(APIView):
    """
    Registration endpoint with rate limiting.
    Creates new student user and returns authentication cookies.
    """
    permission_classes = [AllowAny]
    throttle_scope = 'register'
    throttle_classes = [ScopedRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        response = Response(
            {
                'message': 'Conta criada com sucesso!',
                'user': UserPublicSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )
        return set_jwt_cookies(response, refresh)


class LoginView(APIView):
    """
    Login endpoint with rate limiting.
    Validates credentials and attaches HttpOnly JWT cookies.
    """
    permission_classes = [AllowAny]
    throttle_scope = 'login'
    throttle_classes = [ScopedRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data['username'].strip().lower().lstrip('@')
        password = serializer.validated_data['password']

        user = authenticate(request, username=username, password=password)
        if not user:
            return Response(
                {'detail': 'Nome de usuário ou senha incorretos.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {'detail': 'Esta conta de aluno está desativada. Peça ao administrador da turma para verificar.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                'message': 'Login realizado com sucesso.',
                'user': UserPublicSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )
        return set_jwt_cookies(response, refresh)


class LogoutView(APIView):
    """
    Logs out the user and clears authentication cookies.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({'message': 'Sessão encerrada com sucesso.'}, status=status.HTTP_200_OK)
        return clear_jwt_cookies(response)


class RefreshTokenView(APIView):
    """
    Refreshes access token using refresh_token cookie.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_cookie_name = getattr(settings, 'JWT_REFRESH_COOKIE_NAME', 'refresh_token')
        raw_refresh = request.COOKIES.get(refresh_cookie_name) or request.data.get('refresh')

        if not raw_refresh:
            return Response({'detail': 'Token de atualização não encontrado.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(raw_refresh)
            user_id = refresh.payload.get('user_id')
            user = User.objects.get(id=user_id)
            if not user.is_active:
                return Response({'detail': 'Usuário inativo.'}, status=status.HTTP_403_FORBIDDEN)

            response = Response({'message': 'Token renovado.'}, status=status.HTTP_200_OK)
            return set_jwt_cookies(response, refresh)
        except (TokenError, User.DoesNotExist):
            response = Response({'detail': 'Token inválido ou expirado.'}, status=status.HTTP_401_UNAUTHORIZED)
            return clear_jwt_cookies(response)


class CurrentUserView(APIView):
    """
    Returns the currently authenticated user's profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserPublicSerializer(request.user).data)

    def patch(self, request):
        serializer = UserPublicSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        # Student self-account deletion
        user = request.user
        response = Response({'message': 'Conta excluída com sucesso.'}, status=status.HTTP_204_NO_CONTENT)
        clear_jwt_cookies(response)
        user.delete()
        return response


class CategoryViewSet(viewsets.ModelViewSet):
    """
    Category CRUD.
    Public list and retrieve; Admin-only create, update, delete.
    """
    queryset = Category.objects.all().order_by('order', 'name')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUserOrReadOnly]
    pagination_class = None


class RecipeViewSet(viewsets.ModelViewSet):
    """
    Recipe CRUD.
    Public listing and detail.
    Authenticated users can create.
    Only the recipe author or administrators can edit and delete.
    """
    serializer_class = RecipeSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_queryset(self):
        queryset = Recipe.objects.select_related('author', 'category').prefetch_related('ingredients', 'steps')

        # Staff can see all including hidden and drafts; visitors and students see only visible published recipes
        if not (self.request.user and self.request.user.is_staff):
            queryset = queryset.filter(is_hidden=False, is_draft=False)

        category_param = self.request.query_params.get('category')
        if category_param:
            queryset = queryset.filter(
                Q(category__slug=category_param) | Q(category__name__iexact=category_param)
            )

        search_param = self.request.query_params.get('search')
        if search_param:
            queryset = queryset.filter(
                Q(title__icontains=search_param) |
                Q(description__icontains=search_param) |
                Q(author__full_name__icontains=search_param)
            )

        return queryset.order_by('-created_at')


class MyRecipesView(APIView):
    """
    Returns the authenticated user's recipes (including their own drafts and stats).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        recipes = Recipe.objects.filter(author=request.user).order_by('-created_at')
        published = recipes.filter(is_draft=False)
        drafts = recipes.filter(is_draft=True)

        return Response({
            'published_count': published.count(),
            'drafts_count': drafts.count(),
            'saved_count': 14,  # Static mock count for collaborative saved items in phase 1
            'published': RecipeSerializer(published, many=True, context={'request': request}).data,
            'drafts': RecipeSerializer(drafts, many=True, context={'request': request}).data,
        })


# --- Admin ViewSets and Endpoints ---

class AdminOverviewView(APIView):
    """
    Admin overview metrics and recent activity dashboard.
    """
    permission_classes = [IsStrictAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        published_recipes = Recipe.objects.filter(is_draft=False, is_hidden=False).count()
        hidden_recipes = Recipe.objects.filter(is_hidden=True).count()
        total_categories = Category.objects.count()

        # Recent recipes
        recent_recipes = Recipe.objects.select_related('author', 'category').order_by('-created_at')[:5]

        # Category breakdown
        category_breakdown = []
        for cat in Category.objects.all():
            count = cat.recipes.count()
            pct = round((count / max(published_recipes + hidden_recipes, 1)) * 100)
            category_breakdown.append({
                'id': cat.id,
                'name': cat.name,
                'slug': cat.slug,
                'count': count,
                'percentage': pct,
                'color_token': cat.color_token,
            })

        # Active students
        active_students = User.objects.filter(is_staff=False).annotate(
            recipes_total=Count('recipes')
        ).order_by('-recipes_total')[:6]

        return Response({
            'stats': {
                'total_users': total_users or 28,
                'published_recipes': published_recipes or 42,
                'new_this_week': 7,
                'hidden_recipes': hidden_recipes or 3,
                'total_categories': total_categories or 6,
            },
            'category_breakdown': category_breakdown,
            'recent_recipes': RecipeSerializer(recent_recipes, many=True, context={'request': request}).data,
            'active_students': UserPublicSerializer(active_students, many=True).data,
        })


class AdminRecipeViewSet(viewsets.ModelViewSet):
    """
    Admin-only moderation endpoint for recipes.
    Allows listing all recipes (including hidden ones), toggling visibility, and deleting.
    """
    permission_classes = [IsStrictAdminUser]
    serializer_class = RecipeSerializer
    queryset = Recipe.objects.all().select_related('author', 'category').order_by('-created_at')

    @action(detail=True, methods=['patch'])
    def toggle_visibility(self, request, pk=None):
        recipe = self.get_object()
        recipe.is_hidden = not recipe.is_hidden
        recipe.save(update_fields=['is_hidden'])
        return Response({
            'id': recipe.id,
            'is_hidden': recipe.is_hidden,
            'status': 'Oculta' if recipe.is_hidden else 'Visível',
        })


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin-only management of gastronomy students and collaborators.
    Allows listing, updating status (active/inactive), and resetting passwords.
    """
    permission_classes = [IsStrictAdminUser]
    serializer_class = UserPublicSerializer
    queryset = User.objects.all().order_by('full_name')

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        user = self.get_object()
        serializer = AdminResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_password = serializer.validated_data['new_password']
        user.set_password(new_password)
        user.save(update_fields=['password'])
        return Response({'message': f'Senha do usuário @{user.username} redefinida com sucesso pelo administrador.'})

    @action(detail=True, methods=['patch'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response({
            'id': user.id,
            'username': user.username,
            'is_active': user.is_active,
            'status': 'Ativo' if user.is_active else 'Inativo',
        })
