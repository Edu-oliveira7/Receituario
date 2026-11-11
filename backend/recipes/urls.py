from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AdminOverviewView,
    AdminRecipeViewSet,
    AdminUserViewSet,
    CategoryViewSet,
    CurrentUserView,
    LoginView,
    LogoutView,
    MyRecipesView,
    RecipeViewSet,
    RefreshTokenView,
    RegisterView,
)

router = DefaultRouter()
router.register(r'recipes', RecipeViewSet, basename='recipe')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'admin/recipes', AdminRecipeViewSet, basename='admin-recipe')
router.register(r'admin/users', AdminUserViewSet, basename='admin-user')

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),

    # Student personal recipes
    path('me/recipes/', MyRecipesView.as_view(), name='my-recipes'),

    # Admin dashboard overview
    path('admin/overview/', AdminOverviewView.as_view(), name='admin-overview'),

    # REST Router endpoints (recipes, categories, admin CRUD)
    path('', include(router.urls)),
]
