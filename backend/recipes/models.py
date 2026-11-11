from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """
    Custom user model based on AbstractUser.
    Registration uses full_name, username, and password (no email required).
    """
    full_name = models.CharField(max_length=150, verbose_name="Nome completo")
    turma = models.CharField(max_length=100, blank=True, default="Turma 3B", verbose_name="Turma")
    modulo = models.CharField(max_length=100, blank=True, default="Confeitaria & Cozinha Quente", verbose_name="Módulo")
    bio = models.TextField(blank=True, default="", verbose_name="Biografia")

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"
        ordering = ['full_name', 'username']

    def __str__(self):
        return f"{self.full_name} (@{self.username})"

    @property
    def initials(self):
        parts = self.full_name.strip().split()
        if len(parts) >= 2:
            return f"{parts[0][0]}{parts[-1][0]}".upper()
        elif parts:
            return parts[0][:2].upper()
        return self.username[:2].upper()


class Category(models.Model):
    """
    Category model with associated Caderno Coletivo color tokens.
    Categories define the visual theme for all recipes assigned to them.
    """
    name = models.CharField(max_length=100, unique=True, verbose_name="Nome")
    slug = models.SlugField(max_length=100, unique=True, verbose_name="Slug")
    color_token = models.CharField(max_length=50, verbose_name="Token de Cor")
    order = models.PositiveIntegerField(default=0, verbose_name="Ordem de exibição")

    class Meta:
        verbose_name = "Categoria"
        verbose_name_plural = "Categorias"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Recipe(models.Model):
    """
    Recipe entity with strict author assignment and category theme.
    """
    DIFFICULTY_CHOICES = [
        ('Fácil', 'Fácil'),
        ('Médio', 'Médio'),
        ('Difícil', 'Difícil'),
    ]

    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recipes',
        verbose_name="Autor"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='recipes',
        verbose_name="Categoria"
    )
    title = models.CharField(max_length=200, verbose_name="Título da Receita")
    description = models.TextField(verbose_name="Descrição curta")
    prep_time_minutes = models.PositiveIntegerField(verbose_name="Tempo de preparo (minutos)")
    servings = models.CharField(max_length=100, verbose_name="Rendimento (ex: 12 fatias, 4 porções)")
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='Fácil', verbose_name="Dificuldade")
    is_hidden = models.BooleanField(default=False, verbose_name="Oculta na moderação")
    is_draft = models.BooleanField(default=False, verbose_name="Rascunho")
    chef_tip = models.TextField(blank=True, default="", verbose_name="Dica do Autor/Chef")
    photo_tag = models.CharField(max_length=150, blank=True, default="", verbose_name="Descrição visual da foto")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data de criação")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última atualização")

    class Meta:
        verbose_name = "Receita"
        verbose_name_plural = "Receitas"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.author.full_name}"


class RecipeIngredient(models.Model):
    """
    Ingredients associated with a recipe.
    """
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='ingredients',
        verbose_name="Receita"
    )
    name = models.CharField(max_length=200, verbose_name="Nome do ingrediente")
    quantity = models.CharField(max_length=100, blank=True, default="", verbose_name="Quantidade / Medida")
    order = models.PositiveIntegerField(default=0, verbose_name="Ordem")

    class Meta:
        verbose_name = "Ingrediente"
        verbose_name_plural = "Ingredientes"
        ordering = ['order', 'id']

    def __str__(self):
        if self.quantity:
            return f"{self.quantity} - {self.name}"
        return self.name


class RecipeStep(models.Model):
    """
    Sequential preparation steps for a recipe.
    """
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='steps',
        verbose_name="Receita"
    )
    title = models.CharField(max_length=150, blank=True, default="", verbose_name="Título da etapa")
    text = models.TextField(verbose_name="Instruções")
    order = models.PositiveIntegerField(default=0, verbose_name="Ordem")

    class Meta:
        verbose_name = "Passo de preparo"
        verbose_name_plural = "Passos de preparo"
        ordering = ['order', 'id']

    def __str__(self):
        return f"Passo {self.order + 1}: {self.title or self.text[:30]}"
