from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Category, Recipe, RecipeIngredient, RecipeStep

User = get_user_model()


class UserPublicSerializer(serializers.ModelSerializer):
    """
    Public representation of a user / student.
    Never exposes passwords or sensitive credentials.
    """
    recipes_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'full_name',
            'turma',
            'modulo',
            'bio',
            'initials',
            'is_staff',
            'is_active',
            'recipes_count',
            'date_joined',
        ]
        read_only_fields = ['id', 'username', 'initials', 'is_staff', 'is_active', 'date_joined']

    def get_recipes_count(self, obj):
        return obj.recipes.filter(is_hidden=False, is_draft=False).count()


class RegisterSerializer(serializers.Serializer):
    """
    User registration serializer.
    Requires full_name, username, password and password_confirm.
    Password must be at least 8 characters.
    """
    full_name = serializers.CharField(
        max_length=150,
        required=True,
        error_messages={
            'required': 'O nome completo é obrigatório.',
            'blank': 'O nome completo não pode ficar em branco.',
        }
    )
    username = serializers.CharField(
        max_length=150,
        required=True,
        error_messages={
            'required': 'O nome de usuário é obrigatório.',
            'blank': 'O nome de usuário não pode ficar em branco.',
        }
    )
    turma = serializers.CharField(max_length=100, required=False, default="Turma 3B")
    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        error_messages={
            'required': 'A senha é obrigatória.',
            'min_length': 'A senha deve conter no mínimo 8 caracteres.',
        }
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        error_messages={
            'required': 'A confirmação de senha é obrigatória.',
        }
    )

    def validate_username(self, value):
        cleaned_username = value.strip().lower().lstrip('@')
        if len(cleaned_username) < 3:
            raise serializers.ValidationError('O nome de usuário deve ter pelo menos 3 caracteres.')
        if User.objects.filter(username__iexact=cleaned_username).exists():
            raise serializers.ValidationError('Este nome de usuário já está em uso.')
        return cleaned_username

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'As senhas digitadas não coincidem.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            full_name=validated_data['full_name'],
            turma=validated_data.get('turma', 'Turma 3B'),
            password=validated_data['password'],
        )
        return user


class LoginSerializer(serializers.Serializer):
    """
    User login serializer accepting username and password.
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class CategorySerializer(serializers.ModelSerializer):
    """
    Category representation with visual theme metadata and recipe counts.
    """
    recipes_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'color_token', 'order', 'recipes_count']

    def get_recipes_count(self, obj):
        return obj.recipes.filter(is_hidden=False, is_draft=False).count()


class RecipeIngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeIngredient
        fields = ['id', 'name', 'quantity', 'order']


class RecipeStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeStep
        fields = ['id', 'title', 'text', 'order']


class RecipeSerializer(serializers.ModelSerializer):
    """
    Comprehensive Recipe serializer with nested ingredients and preparation steps.
    SECURITY: The author field is strictly read-only and automatically injected from request.user.
    """
    author = UserPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        error_messages={
            'does_not_exist': 'Categoria selecionada inválida ou inexistente.',
            'required': 'A categoria é obrigatória.',
        }
    )
    ingredients = RecipeIngredientSerializer(many=True, required=False)
    steps = RecipeStepSerializer(many=True, required=False)

    class Meta:
        model = Recipe
        fields = [
            'id',
            'title',
            'description',
            'prep_time_minutes',
            'servings',
            'difficulty',
            'is_hidden',
            'is_draft',
            'chef_tip',
            'photo_tag',
            'category',
            'category_id',
            'author',
            'ingredients',
            'steps',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'author',
            'is_hidden',  # Only admins can change is_hidden via admin endpoints
            'created_at',
            'updated_at',
        ]

    def validate_prep_time_minutes(self, value):
        if value <= 0:
            raise serializers.ValidationError('O tempo de preparo deve ser maior que zero minutos.')
        return value

    def validate_title(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError('O título deve conter pelo menos 3 caracteres.')
        return value.strip()

    @transaction.atomic
    def create(self, validated_data):
        # Strict security: author is always request.user
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            raise serializers.ValidationError('Usuário não autenticado.')

        ingredients_data = validated_data.pop('ingredients', [])
        steps_data = validated_data.pop('steps', [])

        # Assign author directly from server session
        recipe = Recipe.objects.create(author=request.user, **validated_data)

        for index, item in enumerate(ingredients_data):
            RecipeIngredient.objects.create(
                recipe=recipe,
                name=item['name'],
                quantity=item.get('quantity', ''),
                order=item.get('order', index)
            )

        for index, step in enumerate(steps_data):
            RecipeStep.objects.create(
                recipe=recipe,
                title=step.get('title', ''),
                text=step['text'],
                order=step.get('order', index)
            )

        return recipe

    @transaction.atomic
    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop('ingredients', None)
        steps_data = validated_data.pop('steps', None)

        # Update base fields (author remains immutable)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update nested ingredients if provided
        if ingredients_data is not None:
            instance.ingredients.all().delete()
            for index, item in enumerate(ingredients_data):
                RecipeIngredient.objects.create(
                    recipe=instance,
                    name=item['name'],
                    quantity=item.get('quantity', ''),
                    order=item.get('order', index)
                )

        # Update nested steps if provided
        if steps_data is not None:
            instance.steps.all().delete()
            for index, step in enumerate(steps_data):
                RecipeStep.objects.create(
                    recipe=instance,
                    title=step.get('title', ''),
                    text=step['text'],
                    order=step.get('order', index)
                )

        return instance


class AdminResetPasswordSerializer(serializers.Serializer):
    """
    Admin serializer to reset any student's password.
    """
    new_password = serializers.CharField(
        min_length=8,
        required=True,
        write_only=True,
        error_messages={
            'required': 'A nova senha é obrigatória.',
            'min_length': 'A nova senha deve ter no mínimo 8 caracteres.',
        }
    )
