from rest_framework import serializers
from .models import (
    Curso, Modulo, Recurso, Pregunta, 
    Inscripcion, ProgresoRecurso, Examen,
    IntentoExamen, RespuestaEstudiante,
    Logro, LogroEstudiante, ActividadEstudiante,
    TemaForo, RespuestaForo, VotoRespuesta
)
from usuarios.models import Creador
from usuarios.models import Usuario


class CreadorSerializer(serializers.ModelSerializer):
    """Serializer para mostrar info del creador del curso"""
    nombre_completo = serializers.SerializerMethodField()
    
    class Meta:
        model = Creador
        fields = ['id_creador', 'especialidad', 'calificacion_promedio', 'nombre_completo']
    
    def get_nombre_completo(self, obj):
        return f"{obj.id_usuario.first_name} {obj.id_usuario.last_name}"


class RecursoSerializer(serializers.ModelSerializer):
    """Serializer para recursos (videos, PDFs, etc.)"""
    
    class Meta:
        model = Recurso
        fields = [
            'id', 'titulo', 'descripcion', 'tipo', 
            'contenido_url', 'contenido_texto', 'orden',
            'duracion_minutos', 'es_gratuito'
        ]


class ModuloSerializer(serializers.ModelSerializer):
    """Serializer para módulos del curso"""
    recursos = RecursoSerializer(many=True, read_only=True)
    total_recursos = serializers.SerializerMethodField()
    
    class Meta:
        model = Modulo
        fields = [
            'id', 'titulo', 'descripcion', 'orden', 
            'icono', 'recursos', 'total_recursos'
        ]
    
    def get_total_recursos(self, obj):
        return obj.recursos.count()


class CursoListSerializer(serializers.ModelSerializer):
    """Serializer para listar cursos (vista resumida)"""
    creador = CreadorSerializer(read_only=True)
    total_modulos = serializers.SerializerMethodField()
    
    class Meta:
        model = Curso
        fields = [
            'id', 'titulo', 'descripcion', 'imagen_portada',
            'creador', 'precio', 'es_gratuito', 'fecha_creacion',
            'activo', 'total_modulos'
        ]
    
    def get_total_modulos(self, obj):
        return obj.modulos.count()


class CursoDetalleSerializer(serializers.ModelSerializer):
    """Serializer para ver detalle completo del curso"""
    creador = CreadorSerializer(read_only=True)
    modulos = ModuloSerializer(many=True, read_only=True)
    total_estudiantes = serializers.SerializerMethodField()
    
    class Meta:
        model = Curso
        fields = [
            'id', 'titulo', 'descripcion', 'imagen_portada',
            'creador', 'precio', 'es_gratuito', 'fecha_creacion',
            'activo', 'modulos', 'total_estudiantes'
        ]
    
    def get_total_estudiantes(self, obj):
        return obj.inscripciones.count()


class InscripcionSerializer(serializers.ModelSerializer):
    """Serializer para inscripciones"""
    curso = CursoListSerializer(read_only=True)
    curso_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Inscripcion
        fields = [
            'id', 'curso', 'curso_id', 'fecha_inscripcion',
            'fecha_ultimo_acceso', 'progreso_porcentaje', 'completado'
        ]
        read_only_fields = ['progreso_porcentaje', 'completado']
    
    def create(self, validated_data):
        # El estudiante se obtiene del usuario autenticado
        estudiante = self.context['request'].user.perfil_estudiante
        validated_data['estudiante'] = estudiante
        return super().create(validated_data)


class ProgresoRecursoSerializer(serializers.ModelSerializer):
    """Serializer para progreso en recursos"""
    recurso = RecursoSerializer(read_only=True)
    
    class Meta:
        model = ProgresoRecurso
        fields = [
            'id', 'recurso', 'completado', 
            'fecha_completado', 'tiempo_dedicado'
        ]


class PreguntaSerializer(serializers.ModelSerializer):
    """Serializer para preguntas (sin mostrar respuesta correcta)"""
    
    class Meta:
        model = Pregunta
        fields = [
            'id', 'texto_pregunta', 'opcion_a', 'opcion_b',
            'opcion_c', 'opcion_d', 'dificultad', 'puntos'
        ]
        # NO incluir 'respuesta_correcta' ni 'explicacion' aquí


class PreguntaConRespuestaSerializer(serializers.ModelSerializer):
    """Serializer para preguntas con respuesta (para corrección)"""
    
    class Meta:
        model = Pregunta
        fields = [
            'id', 'texto_pregunta', 'opcion_a', 'opcion_b',
            'opcion_c', 'opcion_d', 'respuesta_correcta', 
            'explicacion', 'dificultad', 'puntos'
        ]


class ExamenSerializer(serializers.ModelSerializer):
    """Serializer para exámenes"""
    
    class Meta:
        model = Examen
        fields = [
            'id', 'titulo', 'descripcion', 'tipo',
            'duracion_minutos', 'numero_preguntas',
            'puntaje_minimo_aprobacion', 'activo'
        ]


class RespuestaEstudianteSerializer(serializers.ModelSerializer):
    """Serializer para guardar respuestas del estudiante"""
    
    class Meta:
        model = RespuestaEstudiante
        fields = [
            'pregunta', 'respuesta_seleccionada', 
            'tiempo_respuesta'
        ]


class IntentoExamenSerializer(serializers.ModelSerializer):
    """Serializer para intentos de examen"""
    examen = ExamenSerializer(read_only=True)
    respuestas = RespuestaEstudianteSerializer(many=True, read_only=True)
    
    class Meta:
        model = IntentoExamen
        fields = [
            'id', 'examen', 'fecha_inicio', 'fecha_fin',
            'puntaje_obtenido', 'tiempo_usado', 'completado',
            'aprobado', 'respuestas'
        ]
        read_only_fields = [
            'puntaje_obtenido', 'completado', 'aprobado'
        ]


class LogroSerializer(serializers.ModelSerializer):
    """Serializer para logros"""
    
    class Meta:
        model = Logro
        fields = [
            'id', 'nombre', 'descripcion', 'icono',
            'tipo', 'puntos_recompensa', 'condicion_valor'
        ]


class LogroEstudianteSerializer(serializers.ModelSerializer):
    """Serializer para logros del estudiante"""
    logro = LogroSerializer(read_only=True)
    porcentaje_progreso = serializers.SerializerMethodField()
    
    class Meta:
        model = LogroEstudiante
        fields = [
            'id', 'logro', 'fecha_obtenido', 
            'progreso_actual', 'desbloqueado', 'porcentaje_progreso'
        ]
    
    def get_porcentaje_progreso(self, obj):
        if obj.logro.condicion_valor == 0:
            return 100 if obj.desbloqueado else 0
        return min(100, (obj.progreso_actual / obj.logro.condicion_valor) * 100)


class ActividadEstudianteSerializer(serializers.ModelSerializer):
    """Serializer para actividades del estudiante"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = ActividadEstudiante
        fields = [
            'id', 'tipo', 'tipo_display', 'descripcion',
            'fecha', 'puntos_ganados'
        ]


class UsuarioBasicoSerializer(serializers.ModelSerializer):
    """Serializer básico para mostrar info del usuario"""
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'first_name', 'last_name', 'foto_perfil_url']


class RespuestaForoSerializer(serializers.ModelSerializer):
    """Serializer para respuestas del foro"""
    autor = UsuarioBasicoSerializer(read_only=True)
    total_votos = serializers.IntegerField(source='votos', read_only=True)
    
    class Meta:
        model = RespuestaForo
        fields = [
            'id', 'autor', 'contenido', 'fecha_creacion',
            'fecha_actualizacion', 'es_solucion', 'total_votos'
        ]
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']


class TemaForoSerializer(serializers.ModelSerializer):
    """Serializer para temas del foro"""
    autor = UsuarioBasicoSerializer(read_only=True)
    total_respuestas = serializers.SerializerMethodField()
    ultima_actividad = serializers.DateTimeField(source='fecha_actualizacion', read_only=True)
    
    class Meta:
        model = TemaForo
        fields = [
            'id', 'titulo', 'contenido', 'categoria', 'autor',
            'curso', 'fecha_creacion', 'ultima_actividad',
            'cerrado', 'resuelto', 'vistas', 'total_respuestas'
        ]
        read_only_fields = ['fecha_creacion', 'vistas']
    
    def get_total_respuestas(self, obj):
        return obj.respuestas.count()


class TemaForoDetalleSerializer(serializers.ModelSerializer):
    """Serializer detallado para un tema del foro con respuestas"""
    autor = UsuarioBasicoSerializer(read_only=True)
    respuestas = RespuestaForoSerializer(many=True, read_only=True)
    
    class Meta:
        model = TemaForo
        fields = [
            'id', 'titulo', 'contenido', 'categoria', 'autor',
            'curso', 'fecha_creacion', 'fecha_actualizacion',
            'cerrado', 'resuelto', 'vistas', 'respuestas'
        ]