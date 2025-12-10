from django.contrib import admin
from .models import (
    Curso, Modulo, Recurso, Pregunta, 
    Inscripcion, ProgresoRecurso, Examen, 
    IntentoExamen, RespuestaEstudiante
)


@admin.register(Curso)
class CursoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'creador', 'precio', 'es_gratuito', 'activo', 'fecha_creacion']
    list_filter = ['es_gratuito', 'activo']
    search_fields = ['titulo', 'descripcion']


@admin.register(Modulo)
class ModuloAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'curso', 'orden']
    list_filter = ['curso']
    ordering = ['curso', 'orden']


@admin.register(Recurso)
class RecursoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'modulo', 'tipo', 'orden', 'duracion_minutos', 'es_gratuito']
    list_filter = ['tipo', 'es_gratuito']
    search_fields = ['titulo']


@admin.register(Pregunta)
class PreguntaAdmin(admin.ModelAdmin):
    list_display = ['texto_pregunta_corto', 'modulo', 'dificultad', 'puntos', 'respuesta_correcta']
    list_filter = ['dificultad', 'modulo']
    search_fields = ['texto_pregunta']
    
    def texto_pregunta_corto(self, obj):
        return obj.texto_pregunta[:50] + '...' if len(obj.texto_pregunta) > 50 else obj.texto_pregunta
    texto_pregunta_corto.short_description = 'Pregunta'


@admin.register(Inscripcion)
class InscripcionAdmin(admin.ModelAdmin):
    list_display = ['estudiante', 'curso', 'progreso_porcentaje', 'completado', 'fecha_inscripcion']
    list_filter = ['completado', 'curso']
    search_fields = ['estudiante__id_usuario__username']


@admin.register(ProgresoRecurso)
class ProgresoRecursoAdmin(admin.ModelAdmin):
    list_display = ['inscripcion', 'recurso', 'completado', 'tiempo_dedicado']
    list_filter = ['completado']


@admin.register(Examen)
class ExamenAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'curso', 'tipo', 'duracion_minutos', 'numero_preguntas', 'activo']
    list_filter = ['tipo', 'activo', 'curso']


@admin.register(IntentoExamen)
class IntentoExamenAdmin(admin.ModelAdmin):
    list_display = ['estudiante', 'examen', 'puntaje_obtenido', 'completado', 'aprobado', 'fecha_inicio']
    list_filter = ['completado', 'aprobado']


@admin.register(RespuestaEstudiante)
class RespuestaEstudianteAdmin(admin.ModelAdmin):
    list_display = ['intento', 'pregunta_corta', 'respuesta_seleccionada', 'es_correcta']
    list_filter = ['es_correcta']
    
    def pregunta_corta(self, obj):
        return obj.pregunta.texto_pregunta[:30] + '...'
    pregunta_corta.short_description = 'Pregunta'