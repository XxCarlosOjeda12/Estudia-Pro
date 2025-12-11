from rest_framework import serializers
from .models import (
    Curso, Modulo, Recurso, Pregunta, 
    Inscripcion, ProgresoRecurso, Examen,
    IntentoExamen, RespuestaEstudiante,
    Logro, LogroEstudiante, ActividadEstudiante,
    TemaForo, RespuestaForo, VotoRespuesta,
    RecursoComunidad, CalificacionRecurso, DescargaRecurso,
    Formulario, PreguntaFormulario, RespuestaFormulario, DetalleRespuesta
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


# ========== Recursos de Comunidad ==========

class CalificacionRecursoSerializer(serializers.ModelSerializer):
    """Serializer para calificaciones de recursos"""
    usuario = UsuarioBasicoSerializer(read_only=True)
    
    class Meta:
        model = CalificacionRecurso
        fields = ['id', 'usuario', 'calificacion', 'comentario', 'fecha']
        read_only_fields = ['fecha']


class RecursoComunidadSerializer(serializers.ModelSerializer):
    """Serializer para recursos de comunidad"""
    autor = UsuarioBasicoSerializer(read_only=True)
    curso_titulo = serializers.CharField(source='curso.titulo', read_only=True)
    total_calificaciones = serializers.SerializerMethodField()
    
    class Meta:
        model = RecursoComunidad
        fields = [
            'id', 'titulo', 'descripcion', 'tipo', 'archivo_url',
            'contenido_texto', 'autor', 'curso', 'curso_titulo',
            'modulo', 'fecha_creacion', 'descargas',
            'calificacion_promedio', 'total_calificaciones',
            'aprobado', 'activo'
        ]
        read_only_fields = ['descargas', 'calificacion_promedio', 'aprobado']
    
    def get_total_calificaciones(self, obj):
        return obj.calificaciones.count()


class RecursoComunidadDetalleSerializer(serializers.ModelSerializer):
    """Serializer detallado con calificaciones"""
    autor = UsuarioBasicoSerializer(read_only=True)
    calificaciones = CalificacionRecursoSerializer(many=True, read_only=True)
    
    class Meta:
        model = RecursoComunidad
        fields = [
            'id', 'titulo', 'descripcion', 'tipo', 'archivo_url',
            'contenido_texto', 'autor', 'curso', 'modulo',
            'fecha_creacion', 'descargas', 'calificacion_promedio',
            'calificaciones', 'aprobado', 'activo'
        ]


# ========== Formularios ==========

class DetalleRespuestaSerializer(serializers.ModelSerializer):
    """Serializer para detalles de respuesta"""
    pregunta_texto = serializers.CharField(source='pregunta.texto_pregunta', read_only=True)
    
    class Meta:
        model = DetalleRespuesta
        fields = [
            'pregunta', 'pregunta_texto', 'respuesta_texto',
            'respuesta_opcion', 'respuesta_multiple'
        ]


class PreguntaFormularioSerializer(serializers.ModelSerializer):
    """Serializer para preguntas de formulario"""
    
    class Meta:
        model = PreguntaFormulario
        fields = [
            'id', 'texto_pregunta', 'tipo', 'opciones',
            'requerida', 'orden'
        ]


class FormularioSerializer(serializers.ModelSerializer):
    """Serializer para formularios"""
    creador = UsuarioBasicoSerializer(read_only=True)
    total_respuestas = serializers.SerializerMethodField()
    
    class Meta:
        model = Formulario
        fields = [
            'id', 'titulo', 'descripcion', 'tipo', 'curso',
            'creador', 'fecha_creacion', 'fecha_cierre',
            'activo', 'anonimo', 'total_respuestas'
        ]
        read_only_fields = ['fecha_creacion']
    
    def get_total_respuestas(self, obj):
        return obj.respuestas.count()


class FormularioDetalleSerializer(serializers.ModelSerializer):
    """Serializer detallado con preguntas"""
    creador = UsuarioBasicoSerializer(read_only=True)
    preguntas = PreguntaFormularioSerializer(many=True, read_only=True)
    
    class Meta:
        model = Formulario
        fields = [
            'id', 'titulo', 'descripcion', 'tipo', 'curso',
            'creador', 'fecha_creacion', 'fecha_cierre',
            'activo', 'anonimo', 'preguntas'
        ]


class RespuestaFormularioSerializer(serializers.ModelSerializer):
    """Serializer para respuestas de formulario"""
    detalles = DetalleRespuestaSerializer(many=True)
    
    class Meta:
        model = RespuestaFormulario
        fields = ['id', 'formulario', 'fecha', 'detalles']
        read_only_fields = ['fecha']
    
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        
        # Crear respuesta (anónima o con usuario)
        formulario = validated_data['formulario']
        if formulario.anonimo:
            respuesta = RespuestaFormulario.objects.create(
                formulario=formulario,
                usuario=None
            )
        else:
            respuesta = RespuestaFormulario.objects.create(
                formulario=formulario,
                usuario=self.context['request'].user
            )
        
        # Crear detalles de respuesta
        for detalle_data in detalles_data:
            DetalleRespuesta.objects.create(
                respuesta_formulario=respuesta,
                **detalle_data
            )
        
        return respuesta