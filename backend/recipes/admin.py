from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Category, Recipe, RecipeIngredient, RecipeStep


class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 1


class RecipeStepInline(admin.TabularInline):
    model = RecipeStep
    extra = 1


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'full_name', 'turma', 'is_staff', 'is_active')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informações Acadêmicas', {'fields': ('full_name', 'turma', 'modulo', 'bio')}),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'color_token', 'order')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'prep_time_minutes', 'servings', 'is_hidden', 'is_draft', 'created_at')
    list_filter = ('category', 'is_hidden', 'is_draft', 'difficulty')
    search_fields = ('title', 'description', 'author__full_name', 'author__username')
    inlines = [RecipeIngredientInline, RecipeStepInline]
