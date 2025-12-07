from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group

class Command(BaseCommand):
    help = 'Crea los grupos de usuarios'

    def handle(self, *args, **kwargs):
        grupos = ['Administrador', 'Creador', 'Estudiante']
        
        for grupo in grupos:
            Group.objects.get_or_create(name=grupo)
            self.stdout.write(self.style.SUCCESS(f'Grupo "{grupo}" creado'))
        
        self.stdout.write(self.style.SUCCESS('Todos los grupos creados'))