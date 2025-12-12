from django.core.management.base import BaseCommand
from cursos.models import (
    Curso, Modulo, RecursoComunidad, 
    Formulario, PreguntaFormulario
)
from usuarios.models import Usuario


class Command(BaseCommand):
    help = 'Poblar la base de datos con recursos de comunidad y formularios de prueba'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creando datos de prueba para Comunidad y Formularios...\n')
        
        usuario = Usuario.objects.first()
        if not usuario:
            self.stdout.write(self.style.ERROR('No hay usuarios en el sistema. Crea uno primero.'))
            return
        
        self.stdout.write(f'Usando usuario: {usuario.username}')
        
        curso = Curso.objects.first()
        modulo = Modulo.objects.first() if curso else None
        
        self.stdout.write('\n--- Creando Recursos de Comunidad ---')
        
        recursos_data = [
            {
                'titulo': 'Resumen de Fórmulas de Cálculo',
                'descripcion': 'PDF con todas las fórmulas importantes de cálculo diferencial e integral.',
                'tipo': 'DOCUMENTO',
                'archivo_url': 'https://example.com/formulas-calculo.pdf',
                'contenido_texto': '',
                'aprobado': True,
                'activo': True,
            },
            {
                'titulo': 'Video: Trucos para resolver límites',
                'descripcion': 'Video tutorial con técnicas avanzadas para resolver límites indeterminados.',
                'tipo': 'VIDEO',
                'archivo_url': 'https://www.youtube.com/watch?v=ejemplo_limites',
                'contenido_texto': '',
                'aprobado': True,
                'activo': True,
            },
            {
                'titulo': 'Código Python para graficar derivadas',
                'descripcion': 'Script de Python usando matplotlib para visualizar derivadas.',
                'tipo': 'CODIGO',
                'archivo_url': '',
                'contenido_texto': '''import numpy as np
import matplotlib.pyplot as plt

def f(x):
    return x**2

def derivada(x):
    return 2*x

x = np.linspace(-5, 5, 100)
plt.plot(x, f(x), label='f(x) = x²')
plt.plot(x, derivada(x), label="f'(x) = 2x")
plt.legend()
plt.grid(True)
plt.show()
''',
                'aprobado': True,
                'activo': True,
            },
        ]
        
        for recurso_data in recursos_data:
            recurso, created = RecursoComunidad.objects.get_or_create(
                titulo=recurso_data['titulo'],
                autor=usuario,
                defaults={
                    **recurso_data,
                    'curso': curso,
                    'modulo': modulo,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Recurso: {recurso.titulo}'))
            else:
                if not recurso.aprobado:
                    recurso.aprobado = True
                    recurso.save()
                    self.stdout.write(self.style.WARNING(f'  Recurso actualizado a aprobado: {recurso.titulo}'))
                else:
                    self.stdout.write(self.style.WARNING(f'  Recurso ya existía: {recurso.titulo}'))
        

        self.stdout.write('\n--- Creando Formularios ---')
        
        formulario1, created = Formulario.objects.get_or_create(
            titulo='Encuesta de Satisfacción del Curso',
            creador=usuario,
            defaults={
                'descripcion': 'Ayúdanos a mejorar el curso con tu opinión.',
                'tipo': 'ENCUESTA',
                'curso': curso,
                'activo': True,
                'anonimo': False,
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'  Formulario: {formulario1.titulo}'))
            
            preguntas_f1 = [
                {
                    'texto_pregunta': '¿Qué tan satisfecho estás con el contenido del curso?',
                    'tipo': 'ESCALA',
                    'opciones': None,
                    'requerida': True,
                    'orden': 1,
                },
                {
                    'texto_pregunta': '¿Qué módulo te pareció más útil?',
                    'tipo': 'OPCION_MULTIPLE',
                    'opciones': ['Límites', 'Derivadas', 'Integrales', 'Aplicaciones'],
                    'requerida': True,
                    'orden': 2,
                },
                {
                    'texto_pregunta': '¿Recomendarías este curso a otros estudiantes?',
                    'tipo': 'SI_NO',
                    'opciones': None,
                    'requerida': True,
                    'orden': 3,
                },
                {
                    'texto_pregunta': '¿Qué sugerencias tienes para mejorar el curso?',
                    'tipo': 'TEXTO_LARGO',
                    'opciones': None,
                    'requerida': False,
                    'orden': 4,
                },
            ]
            
            for pregunta_data in preguntas_f1:
                PreguntaFormulario.objects.create(
                    formulario=formulario1,
                    **pregunta_data
                )
                self.stdout.write(f'    + Pregunta: {pregunta_data["texto_pregunta"][:40]}...')
        else:
            self.stdout.write(self.style.WARNING(f'  Formulario ya existía: {formulario1.titulo}'))
        
        formulario2, created = Formulario.objects.get_or_create(
            titulo='Feedback Rápido',
            creador=usuario,
            defaults={
                'descripcion': 'Cuéntanos brevemente tu experiencia.',
                'tipo': 'FEEDBACK',
                'curso': curso,
                'activo': True,
                'anonimo': True,  
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'  Formulario: {formulario2.titulo}'))
            
            preguntas_f2 = [
                {
                    'texto_pregunta': '¿Cómo calificarías la dificultad del curso?',
                    'tipo': 'ESCALA',
                    'opciones': None,
                    'requerida': True,
                    'orden': 1,
                },
                {
                    'texto_pregunta': '¿Qué es lo que más te gustó?',
                    'tipo': 'TEXTO_CORTO',
                    'opciones': None,
                    'requerida': False,
                    'orden': 2,
                },
            ]
            
            for pregunta_data in preguntas_f2:
                PreguntaFormulario.objects.create(
                    formulario=formulario2,
                    **pregunta_data
                )
                self.stdout.write(f'    + Pregunta: {pregunta_data["texto_pregunta"][:40]}...')
        else:
            self.stdout.write(self.style.WARNING(f'  Formulario ya existía: {formulario2.titulo}'))
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('¡Datos de prueba creados exitosamente!'))
        self.stdout.write('='*50)
        
        recursos_aprobados = RecursoComunidad.objects.filter(aprobado=True, activo=True)
        formularios_activos = Formulario.objects.filter(activo=True)
        
        self.stdout.write(f'\nRecursos de Comunidad aprobados: {recursos_aprobados.count()}')
        for r in recursos_aprobados[:5]:
            self.stdout.write(f'  ID {r.id}: {r.titulo}')
        
        self.stdout.write(f'\nFormularios activos: {formularios_activos.count()}')
        for f in formularios_activos[:5]:
            self.stdout.write(f'  ID {f.id}: {f.titulo} ({f.preguntas.count()} preguntas)')
        
        self.stdout.write('\nAhora puedes probar en Postman:')
        self.stdout.write('  - GET  /api/recursos-comunidad/')
        self.stdout.write('  - POST /api/recursos-comunidad/1/descargar/')
        self.stdout.write('  - POST /api/recursos-comunidad/1/calificar/')
        self.stdout.write('  - GET  /api/formularios/')
        self.stdout.write('  - GET  /api/formularios/1/')
        self.stdout.write('  - POST /api/formularios/1/responder/')