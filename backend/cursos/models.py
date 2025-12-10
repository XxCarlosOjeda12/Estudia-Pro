from django.db import models
from usuarios.models import Creador, Estudiante


class Curso(models.Model):
    """Modelo principal del curso"""
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    imagen_portada = models.URLField(blank=True, null=True)
    creador = models.ForeignKey(Creador, on_delete=models.CASCADE, related_name='cursos')
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    es_gratuito = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'curso'
        verbose_name = 'Curso'
        verbose_name_plural = 'Cursos'
    
    def __str__(self):
        return self.titulo


class Modulo(models.Model):
    """Módulos o temas dentro de un curso"""
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name='modulos')
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    orden = models.IntegerField(default=0)
    icono = models.CharField(max_length=50, blank=True)
    
    class Meta:
        db_table = 'modulo'
        ordering = ['orden']
        verbose_name = 'Módulo'
        verbose_name_plural = 'Módulos'
    
    def __str__(self):
        return f"{self.curso.titulo} - {self.titulo}"


class Recurso(models.Model):
    """Recursos de aprendizaje (videos, PDFs, lecturas)"""
    TIPOS = [
        ('VIDEO', 'Video'),
        ('PDF', 'PDF'),
        ('LECTURA', 'Lectura'),
        ('EJERCICIO', 'Ejercicio'),
    ]
    
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name='recursos')
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    contenido_url = models.URLField(blank=True, null=True)
    contenido_texto = models.TextField(blank=True)
    orden = models.IntegerField(default=0)
    duracion_minutos = models.IntegerField(default=0)
    es_gratuito = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'recurso'
        ordering = ['orden']
        verbose_name = 'Recurso'
        verbose_name_plural = 'Recursos'
    
    def __str__(self):
        return f"{self.modulo.titulo} - {self.titulo}"


class Pregunta(models.Model):
    """Banco de preguntas para exámenes"""
    DIFICULTADES = [
        ('FACIL', 'Fácil'),
        ('MEDIA', 'Media'),
        ('DIFICIL', 'Difícil'),
    ]
    
    OPCIONES_RESPUESTA = [
        ('A', 'Opción A'),
        ('B', 'Opción B'),
        ('C', 'Opción C'),
        ('D', 'Opción D'),
    ]
    
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name='preguntas')
    texto_pregunta = models.TextField()
    opcion_a = models.CharField(max_length=500)
    opcion_b = models.CharField(max_length=500)
    opcion_c = models.CharField(max_length=500)
    opcion_d = models.CharField(max_length=500)
    respuesta_correcta = models.CharField(max_length=1, choices=OPCIONES_RESPUESTA)
    explicacion = models.TextField(blank=True)
    dificultad = models.CharField(max_length=10, choices=DIFICULTADES)
    puntos = models.IntegerField(default=1)
    
    class Meta:
        db_table = 'pregunta'
        verbose_name = 'Pregunta'
        verbose_name_plural = 'Preguntas'
    
    def __str__(self):
        return f"{self.modulo.titulo} - {self.texto_pregunta[:50]}"


class Inscripcion(models.Model):
    """Estudiante inscrito en un curso"""
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name='inscripciones')
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name='inscripciones')
    fecha_inscripcion = models.DateTimeField(auto_now_add=True)
    fecha_ultimo_acceso = models.DateTimeField(auto_now=True)
    progreso_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    completado = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'inscripcion'
        unique_together = ['estudiante', 'curso']
        verbose_name = 'Inscripción'
        verbose_name_plural = 'Inscripciones'
    
    def __str__(self):
        return f"{self.estudiante.id_usuario.username} - {self.curso.titulo}"


class ProgresoRecurso(models.Model):
    """Progreso del estudiante en cada recurso"""
    inscripcion = models.ForeignKey(Inscripcion, on_delete=models.CASCADE, related_name='progresos')
    recurso = models.ForeignKey(Recurso, on_delete=models.CASCADE)
    completado = models.BooleanField(default=False)
    fecha_completado = models.DateTimeField(null=True, blank=True)
    tiempo_dedicado = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'progreso_recurso'
        unique_together = ['inscripcion', 'recurso']
        verbose_name = 'Progreso de Recurso'
        verbose_name_plural = 'Progresos de Recursos'


class Examen(models.Model):
    """Exámenes y simuladores del curso"""
    TIPOS = [
        ('PRACTICA', 'Práctica'),
        ('SIMULADOR', 'Simulador'),
        ('EVALUACION', 'Evaluación'),
    ]
    
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name='examenes')
    modulo = models.ForeignKey(Modulo, on_delete=models.SET_NULL, null=True, blank=True, related_name='examenes')
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    duracion_minutos = models.IntegerField()
    numero_preguntas = models.IntegerField()
    puntaje_minimo_aprobacion = models.DecimalField(max_digits=5, decimal_places=2, default=70)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'examen'
        verbose_name = 'Examen'
        verbose_name_plural = 'Exámenes'
    
    def __str__(self):
        return f"{self.curso.titulo} - {self.titulo}"


class IntentoExamen(models.Model):
    """Intentos de examen de cada estudiante"""
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name='intentos_examen')
    examen = models.ForeignKey(Examen, on_delete=models.CASCADE, related_name='intentos')
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    puntaje_obtenido = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tiempo_usado = models.IntegerField(default=0)
    completado = models.BooleanField(default=False)
    aprobado = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'intento_examen'
        verbose_name = 'Intento de Examen'
        verbose_name_plural = 'Intentos de Examen'


class RespuestaEstudiante(models.Model):
    """Respuestas del estudiante en un intento de examen"""
    intento = models.ForeignKey(IntentoExamen, on_delete=models.CASCADE, related_name='respuestas')
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE)
    respuesta_seleccionada = models.CharField(max_length=1)
    es_correcta = models.BooleanField(default=False)
    tiempo_respuesta = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'respuesta_estudiante'
        verbose_name = 'Respuesta de Estudiante'
        verbose_name_plural = 'Respuestas de Estudiantes'