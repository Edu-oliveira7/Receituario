from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from recipes.models import Category

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds initial gastronomy categories and creates the primary administrator'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Iniciando o preparo do banco de dados do Receituário...'))

        # 1. Categories
        categories_data = [
            {'name': 'Doces', 'slug': 'doces', 'color_token': 'doces', 'order': 1},
            {'name': 'Massas', 'slug': 'massas', 'color_token': 'massas', 'order': 2},
            {'name': 'Carnes', 'slug': 'carnes', 'color_token': 'carnes', 'order': 3},
            {'name': 'Lanches', 'slug': 'lanches', 'color_token': 'lanches', 'order': 4},
            {'name': 'Saladas', 'slug': 'saladas', 'color_token': 'saladas', 'order': 5},
            {'name': 'Bebidas', 'slug': 'bebidas', 'color_token': 'bebidas', 'order': 6},
        ]

        for cat_info in categories_data:
            cat, created = Category.objects.get_or_create(
                slug=cat_info['slug'],
                defaults={
                    'name': cat_info['name'],
                    'color_token': cat_info['color_token'],
                    'order': cat_info['order'],
                }
            )
            status = 'criada' if created else 'já existia'
            self.stdout.write(f'  ✓ Categoria {cat.name} ({status})')

        # 2. Primary Administrator (Only created if no users exist yet)
        if not User.objects.filter(is_staff=True).exists():
            admin_user = User.objects.create_superuser(
                username='admin',
                full_name='Administrador da Turma',
                turma='Coordenação Pedagógica',
                modulo='Gestão e Curadoria',
                bio='Administrador geral e responsável pela moderação do Receituário.',
                password='Admin12345!'
            )
            self.stdout.write(self.style.SUCCESS('  ✓ Administrador inicial criado: admin / Admin12345!'))
        else:
            self.stdout.write('  ✓ Administrador já configurado no sistema.')

        self.stdout.write(self.style.SUCCESS('\n✓ Banco de dados inicializado com sucesso (sem dados mockados, pronto para produção)!'))
