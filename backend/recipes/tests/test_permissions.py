from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from recipes.models import Category, Recipe, RecipeIngredient, RecipeStep

User = get_user_model()


class ReceituarioPermissionsTestCase(APITestCase):
    """
    Automated security and permission tests verifying:
    1. User A cannot edit or delete User B's recipe (403 Forbidden).
    2. Common authenticated user cannot access admin routes (403 Forbidden).
    3. Admin can edit and delete any recipe.
    4. Unauthenticated visitors cannot create recipes (401 Unauthorized).
    5. The author field cannot be forged in POST or PATCH payloads (server enforces request.user).
    """

    def setUp(self):
        # 1. Create Category
        self.category = Category.objects.create(
            name="Doces",
            slug="doces",
            color_token="doces",
            order=1
        )

        # 2. Create User A (Student 1)
        self.user_a = User.objects.create_user(
            username="marina",
            full_name="Marina Souza",
            turma="Turma 3B",
            password="Password123!"
        )

        # 3. Create User B (Student 2)
        self.user_b = User.objects.create_user(
            username="pedro",
            full_name="Pedro Lima",
            turma="Turma 3A",
            password="Password123!"
        )

        # 4. Create Admin User
        self.admin_user = User.objects.create_superuser(
            username="admin",
            full_name="Chef Coordenador",
            password="AdminPassword123!",
            is_staff=True,
            is_superuser=True
        )

        # 5. Create a Recipe owned by User A
        self.recipe_a = Recipe.objects.create(
            author=self.user_a,
            category=self.category,
            title="Bolo de cenoura",
            description="Massa fofa com calda crocante",
            prep_time_minutes=50,
            servings="12 fatias",
            difficulty="Fácil"
        )
        RecipeIngredient.objects.create(recipe=self.recipe_a, name="Cenoura", quantity="3 médias", order=0)
        RecipeStep.objects.create(recipe=self.recipe_a, text="Bater no liquidificador", order=0)

    # TEST 1: User A cannot edit or delete User B's recipe
    def test_user_b_cannot_edit_user_a_recipe(self):
        """User B attempts to modify User A's recipe -> must return 403 Forbidden"""
        self.client.force_authenticate(user=self.user_b)
        url = reverse('recipe-detail', kwargs={'pk': self.recipe_a.pk})

        response = self.client.patch(url, {'title': 'Título Alterado por Hacker'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Verify database remained unchanged
        self.recipe_a.refresh_from_db()
        self.assertEqual(self.recipe_a.title, "Bolo de cenoura")

    def test_user_b_cannot_delete_user_a_recipe(self):
        """User B attempts to delete User A's recipe -> must return 403 Forbidden"""
        self.client.force_authenticate(user=self.user_b)
        url = reverse('recipe-detail', kwargs={'pk': self.recipe_a.pk})

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Recipe.objects.filter(pk=self.recipe_a.pk).exists())

    # TEST 2: Common user cannot access admin routes
    def test_common_user_cannot_access_admin_overview(self):
        """Standard student attempts to view /api/admin/overview/ -> 403 Forbidden"""
        self.client.force_authenticate(user=self.user_a)
        url = reverse('admin-overview')

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_common_user_cannot_access_admin_users_list(self):
        """Standard student attempts to list or modify users via admin endpoint -> 403 Forbidden"""
        self.client.force_authenticate(user=self.user_a)
        url = reverse('admin-user-list')

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_common_user_cannot_reset_passwords(self):
        """Standard student attempts to trigger password reset -> 403 Forbidden"""
        self.client.force_authenticate(user=self.user_a)
        url = reverse('admin-user-reset-password', kwargs={'pk': self.user_b.pk})

        response = self.client.post(url, {'new_password': 'NewPassword123!'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # TEST 3: Admin can edit and delete any recipe
    def test_admin_can_edit_any_recipe(self):
        """Admin updates User A's recipe -> 200 OK"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('recipe-detail', kwargs={'pk': self.recipe_a.pk})

        response = self.client.patch(url, {'title': 'Bolo de cenoura Revisado'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.recipe_a.refresh_from_db()
        self.assertEqual(self.recipe_a.title, 'Bolo de cenoura Revisado')

    def test_admin_can_delete_any_recipe(self):
        """Admin deletes User A's recipe -> 204 No Content"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('recipe-detail', kwargs={'pk': self.recipe_a.pk})

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Recipe.objects.filter(pk=self.recipe_a.pk).exists())

    # TEST 4: Visitor cannot create recipes
    def test_visitor_cannot_create_recipe(self):
        """Unauthenticated visitor tries to post recipe -> 401 Unauthorized"""
        self.client.logout()
        url = reverse('recipe-list')
        data = {
            'title': 'Receita Fantasma',
            'category_id': self.category.id,
            'description': 'Teste sem login',
            'prep_time_minutes': 30,
            'servings': '2 porções',
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # TEST 5: Author field cannot be forged
    def test_author_field_cannot_be_forged(self):
        """User B tries to send author=User A's ID -> server sets author=User B"""
        self.client.force_authenticate(user=self.user_b)
        url = reverse('recipe-list')
        data = {
            'title': 'Receita Autêntica',
            'category_id': self.category.id,
            'description': 'Tentando forjar autoria',
            'prep_time_minutes': 25,
            'servings': '4 porções',
            'author': self.user_a.id,       # Malicious attempt to forge User A
            'author_id': self.user_a.id,    # Malicious attempt
            'user_id': self.user_a.id,      # Malicious attempt
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created_recipe_id = response.data['id']
        created_recipe = Recipe.objects.get(id=created_recipe_id)

        # STRICT ASSERTION: Author MUST be User B (the authenticated user)
        self.assertEqual(created_recipe.author, self.user_b)
        self.assertNotEqual(created_recipe.author, self.user_a)

    # Owner can edit their own recipe
    def test_owner_can_edit_own_recipe(self):
        """User A edits their own recipe -> 200 OK"""
        self.client.force_authenticate(user=self.user_a)
        url = reverse('recipe-detail', kwargs={'pk': self.recipe_a.pk})

        response = self.client.patch(url, {'description': 'Descrição atualizada pela Marina'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.recipe_a.refresh_from_db()
        self.assertEqual(self.recipe_a.description, 'Descrição atualizada pela Marina')
