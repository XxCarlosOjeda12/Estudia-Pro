from django.core.management.base import BaseCommand
from cursos.models import Curso, Modulo, Recurso, Pregunta, Examen
from usuarios.models import Usuario, Creador


class Command(BaseCommand):
    help = 'Poblar la base de datos con el curso de Cálculo Diferencial'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creando curso de Cálculo Diferencial...')
        
        # 1. Crear o obtener un creador
        try:
            usuario_creador = Usuario.objects.filter(rol='CREADOR').first()
            if not usuario_creador:
                self.stdout.write(self.style.WARNING('No hay usuarios creadores. Creando uno...'))
                usuario_creador = Usuario.objects.create_user(
                    username='prof_matematicas',
                    email='profesor@example.com',
                    password='profesor123',
                    first_name='Juan',
                    last_name='Pérez',
                    rol='CREADOR'
                )
                creador = Creador.objects.create(
                    id_usuario=usuario_creador,
                    especialidad='Matemáticas'
                )
            else:
                creador = usuario_creador.perfil_creador
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error al crear creador: {e}'))
            return
        
        # 2. Crear el curso
        curso, created = Curso.objects.get_or_create(
            titulo='Cálculo Diferencial',
            defaults={
                'descripcion': 'Curso completo de Cálculo Diferencial para nivel preparatoria y universidad. Aprende límites, derivadas, integrales y sus aplicaciones.',
                'creador': creador,
                'precio': 499.00,
                'es_gratuito': False,
                'activo': True
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('✓ Curso creado'))
        else:
            self.stdout.write(self.style.WARNING('○ Curso ya existía'))
        
        # 3. Crear módulos
        modulos_data = [
            {
                'titulo': 'Límites',
                'descripcion': 'Introducción a los límites, definición formal, propiedades y teoremas',
                'orden': 1,
                'icono': '📊'
            },
            {
                'titulo': 'Derivadas',
                'descripcion': 'Definición de derivada, reglas de derivación y aplicaciones',
                'orden': 2,
                'icono': '📈'
            },
            {
                'titulo': 'Integrales',
                'descripcion': 'Integral definida e indefinida, técnicas de integración',
                'orden': 3,
                'icono': '∫'
            },
            {
                'titulo': 'Aplicaciones',
                'descripcion': 'Aplicaciones del cálculo diferencial en problemas reales',
                'orden': 4,
                'icono': '🎯'
            }
        ]
        
        modulos = []
        for modulo_data in modulos_data:
            modulo, created = Modulo.objects.get_or_create(
                curso=curso,
                titulo=modulo_data['titulo'],
                defaults={
                    'descripcion': modulo_data['descripcion'],
                    'orden': modulo_data['orden'],
                    'icono': modulo_data['icono']
                }
            )
            modulos.append(modulo)
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Módulo: {modulo.titulo}'))
        
        # 4. Crear recursos para cada módulo
        self.crear_recursos_limites(modulos[0])
        self.crear_recursos_derivadas(modulos[1])
        self.crear_recursos_integrales(modulos[2])
        self.crear_recursos_aplicaciones(modulos[3])
        
        # 5. Crear preguntas
        self.crear_preguntas_limites(modulos[0])
        self.crear_preguntas_derivadas(modulos[1])
        
        # 6. Crear exámenes
        self.crear_examenes(curso, modulos)
        
        self.stdout.write(self.style.SUCCESS('\n¡Curso de Cálculo Diferencial creado exitosamente!'))
    
    def crear_recursos_limites(self, modulo):
        recursos = [
            {
                'titulo': 'Introducción a los límites',
                'tipo': 'VIDEO',
                'contenido_url': 'https://www.youtube.com/watch?v=ejemplo1',
                'duracion_minutos': 15,
                'orden': 1
            },
            {
                'titulo': 'Definición formal de límite',
                'tipo': 'LECTURA',
                'contenido_texto': 'El límite de una función f(x) cuando x tiende a un valor a...',
                'duracion_minutos': 10,
                'orden': 2
            },
            {
                'titulo': 'Propiedades de los límites',
                'tipo': 'PDF',
                'contenido_url': 'https://example.com/propiedades-limites.pdf',
                'duracion_minutos': 20,
                'orden': 3
            },
            {
                'titulo': 'Ejercicios de límites',
                'tipo': 'EJERCICIO',
                'contenido_texto': 'Resuelve los siguientes ejercicios...',
                'duracion_minutos': 30,
                'orden': 4
            }
        ]
        
        for recurso_data in recursos:
            Recurso.objects.get_or_create(
                modulo=modulo,
                titulo=recurso_data['titulo'],
                defaults=recurso_data
            )
    
    def crear_recursos_derivadas(self, modulo):
        recursos = [
            {
                'titulo': 'Concepto de derivada',
                'tipo': 'VIDEO',
                'contenido_url': 'https://www.youtube.com/watch?v=ejemplo2',
                'duracion_minutos': 20,
                'orden': 1
            },
            {
                'titulo': 'Reglas de derivación',
                'tipo': 'LECTURA',
                'contenido_texto': 'Las principales reglas de derivación son...',
                'duracion_minutos': 15,
                'orden': 2
            },
            {
                'titulo': 'Derivadas de funciones trigonométricas',
                'tipo': 'VIDEO',
                'contenido_url': 'https://www.youtube.com/watch?v=ejemplo3',
                'duracion_minutos': 25,
                'orden': 3
            }
        ]
        
        for recurso_data in recursos:
            Recurso.objects.get_or_create(
                modulo=modulo,
                titulo=recurso_data['titulo'],
                defaults=recurso_data
            )
    
    def crear_recursos_integrales(self, modulo):
        recursos = [
            {
                'titulo': 'Introducción a las integrales',
                'tipo': 'VIDEO',
                'contenido_url': 'https://www.youtube.com/watch?v=ejemplo4',
                'duracion_minutos': 18,
                'orden': 1
            },
            {
                'titulo': 'Técnicas de integración',
                'tipo': 'PDF',
                'contenido_url': 'https://example.com/tecnicas-integracion.pdf',
                'duracion_minutos': 25,
                'orden': 2
            }
        ]
        
        for recurso_data in recursos:
            Recurso.objects.get_or_create(
                modulo=modulo,
                titulo=recurso_data['titulo'],
                defaults=recurso_data
            )
    
    def crear_recursos_aplicaciones(self, modulo):
        recursos = [
            {
                'titulo': 'Problemas de optimización',
                'tipo': 'VIDEO',
                'contenido_url': 'https://www.youtube.com/watch?v=ejemplo5',
                'duracion_minutos': 22,
                'orden': 1
            },
            {
                'titulo': 'Razones de cambio',
                'tipo': 'LECTURA',
                'contenido_texto': 'Las razones de cambio nos permiten...',
                'duracion_minutos': 12,
                'orden': 2
            }
        ]
        
        for recurso_data in recursos:
            Recurso.objects.get_or_create(
                modulo=modulo,
                titulo=recurso_data['titulo'],
                defaults=recurso_data
            )
    
    def crear_preguntas_limites(self, modulo):
        preguntas = [
            {
                'texto_pregunta': '¿Qué es un límite en cálculo?',
                'opcion_a': 'El valor máximo que puede alcanzar una función',
                'opcion_b': 'El valor al que se aproxima una función cuando x tiende a un punto',
                'opcion_c': 'La derivada de una función',
                'opcion_d': 'La integral de una función',
                'respuesta_correcta': 'B',
                'explicacion': 'Un límite es el valor al que se aproxima una función cuando la variable independiente se acerca a un punto determinado.',
                'dificultad': 'FACIL',
                'puntos': 1
            },
            {
                'texto_pregunta': 'El límite de (x²-4)/(x-2) cuando x→2 es:',
                'opcion_a': '0',
                'opcion_b': '2',
                'opcion_c': '4',
                'opcion_d': 'Indefinido',
                'respuesta_correcta': 'C',
                'explicacion': 'Factorizando: (x-2)(x+2)/(x-2) = x+2, cuando x→2 el resultado es 4',
                'dificultad': 'MEDIA',
                'puntos': 2
            },
            {
                'texto_pregunta': '¿Cuál es el límite de sen(x)/x cuando x→0?',
                'opcion_a': '0',
                'opcion_b': '1',
                'opcion_c': '∞',
                'opcion_d': 'No existe',
                'respuesta_correcta': 'B',
                'explicacion': 'Este es un límite notable fundamental en cálculo, su valor es 1',
                'dificultad': 'MEDIA',
                'puntos': 2
            }
        ]
        
        for pregunta_data in preguntas:
            Pregunta.objects.get_or_create(
                modulo=modulo,
                texto_pregunta=pregunta_data['texto_pregunta'],
                defaults=pregunta_data
            )
    
    def crear_preguntas_derivadas(self, modulo):
        preguntas = [
            {
                'texto_pregunta': '¿Qué representa la derivada de una función?',
                'opcion_a': 'El área bajo la curva',
                'opcion_b': 'La pendiente de la recta tangente',
                'opcion_c': 'El valor máximo de la función',
                'opcion_d': 'La integral de la función',
                'respuesta_correcta': 'B',
                'explicacion': 'La derivada representa la pendiente de la recta tangente a la función en un punto',
                'dificultad': 'FACIL',
                'puntos': 1
            },
            {
                'texto_pregunta': 'La derivada de x³ es:',
                'opcion_a': 'x²',
                'opcion_b': '3x',
                'opcion_c': '3x²',
                'opcion_d': 'x⁴/4',
                'respuesta_correcta': 'C',
                'explicacion': 'Usando la regla de la potencia: d/dx(xⁿ) = n·xⁿ⁻¹, entonces d/dx(x³) = 3x²',
                'dificultad': 'FACIL',
                'puntos': 1
            }
        ]
        
        for pregunta_data in preguntas:
            Pregunta.objects.get_or_create(
                modulo=modulo,
                texto_pregunta=pregunta_data['texto_pregunta'],
                defaults=pregunta_data
            )
    
    def crear_examenes(self, curso, modulos):
        # Examen de práctica
        Examen.objects.get_or_create(
            curso=curso,
            titulo='Examen de Práctica - Cálculo Diferencial',
            defaults={
                'descripcion': 'Examen de práctica para evaluar tus conocimientos',
                'tipo': 'PRACTICA',
                'duracion_minutos': 60,
                'numero_preguntas': 20,
                'puntaje_minimo_aprobacion': 60
            }
        )
        
        # Simulador
        Examen.objects.get_or_create(
            curso=curso,
            titulo='Simulador de Examen Final',
            defaults={
                'descripcion': 'Simulador del examen final con condiciones reales',
                'tipo': 'SIMULADOR',
                'duracion_minutos': 120,
                'numero_preguntas': 50,
                'puntaje_minimo_aprobacion': 70
            }
        )