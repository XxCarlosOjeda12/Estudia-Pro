from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import (
    Curso, Modulo, Recurso, Pregunta,
    Inscripcion, ProgresoRecurso, Examen,
    IntentoExamen, RespuestaEstudiante
)
from .serializers import (
    CursoListSerializer, CursoDetalleSerializer,
    ModuloSerializer, RecursoSerializer,
    InscripcionSerializer, ProgresoRecursoSerializer,
    PreguntaSerializer, PreguntaConRespuestaSerializer,
    ExamenSerializer, IntentoExamenSerializer,
    RespuestaEstudianteSerializer
)


class CursoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para ver cursos disponibles
    """
    queryset = Curso.objects.filter(activo=True)
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CursoDetalleSerializer
        return CursoListSerializer
    
    @action(detail=True, methods=['get'])
    def modulos(self, request, pk=None):
        """Obtener módulos de un curso"""
        curso = self.get_object()
        modulos = curso.modulos.all()
        serializer = ModuloSerializer(modulos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def inscribirse(self, request, pk=None):
        """Inscribir al estudiante en un curso"""
        curso = self.get_object()
        
        # Verificar que el usuario es estudiante
        if not hasattr(request.user, 'perfil_estudiante'):
            return Response(
                {'error': 'Solo los estudiantes pueden inscribirse en cursos'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        estudiante = request.user.perfil_estudiante
        
        # Verificar si ya está inscrito
        if Inscripcion.objects.filter(estudiante=estudiante, curso=curso).exists():
            return Response(
                {'error': 'Ya estás inscrito en este curso'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear inscripción
        inscripcion = Inscripcion.objects.create(
            estudiante=estudiante,
            curso=curso
        )
        
        serializer = InscripcionSerializer(inscripcion)
        return Response(
            {
                'message': 'Inscripción exitosa',
                'inscripcion': serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def mi_progreso(self, request, pk=None):
        """Ver progreso del estudiante en el curso"""
        curso = self.get_object()
        
        if not hasattr(request.user, 'perfil_estudiante'):
            return Response(
                {'error': 'Solo disponible para estudiantes'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        estudiante = request.user.perfil_estudiante
        
        try:
            inscripcion = Inscripcion.objects.get(
                estudiante=estudiante,
                curso=curso
            )
            
            # Obtener progreso de recursos
            progresos = ProgresoRecurso.objects.filter(
                inscripcion=inscripcion
            )
            
            total_recursos = Recurso.objects.filter(
                modulo__curso=curso
            ).count()
            
            recursos_completados = progresos.filter(
                completado=True
            ).count()
            
            porcentaje = (recursos_completados / total_recursos * 100) if total_recursos > 0 else 0
            
            # Actualizar porcentaje en inscripción
            inscripcion.progreso_porcentaje = round(porcentaje, 2)
            inscripcion.save()
            
            return Response({
                'progreso_porcentaje': inscripcion.progreso_porcentaje,
                'recursos_completados': recursos_completados,
                'total_recursos': total_recursos,
                'fecha_inscripcion': inscripcion.fecha_inscripcion,
                'ultimo_acceso': inscripcion.fecha_ultimo_acceso
            })
            
        except Inscripcion.DoesNotExist:
            return Response(
                {'error': 'No estás inscrito en este curso'},
                status=status.HTTP_404_NOT_FOUND
            )


class RecursoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para ver recursos de aprendizaje
    """
    queryset = Recurso.objects.all()
    serializer_class = RecursoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def marcar_completado(self, request, pk=None):
        """Marcar un recurso como completado"""
        recurso = self.get_object()
        
        if not hasattr(request.user, 'perfil_estudiante'):
            return Response(
                {'error': 'Solo disponible para estudiantes'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        estudiante = request.user.perfil_estudiante
        curso = recurso.modulo.curso
        
        # Obtener o crear inscripción
        inscripcion, _ = Inscripcion.objects.get_or_create(
            estudiante=estudiante,
            curso=curso
        )
        
        # Crear o actualizar progreso
        progreso, created = ProgresoRecurso.objects.get_or_create(
            inscripcion=inscripcion,
            recurso=recurso
        )
        
        progreso.completado = True
        progreso.fecha_completado = timezone.now()
        progreso.tiempo_dedicado = request.data.get('tiempo_dedicado', 0)
        progreso.save()
        
        return Response({
            'message': 'Recurso marcado como completado',
            'progreso': ProgresoRecursoSerializer(progreso).data
        })


class PreguntaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para banco de preguntas
    """
    queryset = Pregunta.objects.all()
    serializer_class = PreguntaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def por_modulo(self, request):
        """Obtener preguntas de un módulo específico"""
        modulo_id = request.query_params.get('modulo_id')
        
        if not modulo_id:
            return Response(
                {'error': 'Se requiere el parámetro modulo_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        preguntas = Pregunta.objects.filter(modulo_id=modulo_id)
        serializer = self.get_serializer(preguntas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_dificultad(self, request):
        """Filtrar preguntas por dificultad"""
        dificultad = request.query_params.get('dificultad')
        modulo_id = request.query_params.get('modulo_id')
        
        preguntas = Pregunta.objects.all()
        
        if dificultad:
            preguntas = preguntas.filter(dificultad=dificultad.upper())
        
        if modulo_id:
            preguntas = preguntas.filter(modulo_id=modulo_id)
        
        serializer = self.get_serializer(preguntas, many=True)
        return Response(serializer.data)


class ExamenViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para exámenes y simuladores
    """
    queryset = Examen.objects.filter(activo=True)
    serializer_class = ExamenSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Iniciar un intento de examen"""
        examen = self.get_object()
        
        if not hasattr(request.user, 'perfil_estudiante'):
            return Response(
                {'error': 'Solo disponible para estudiantes'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        estudiante = request.user.perfil_estudiante
        
        # Crear intento
        intento = IntentoExamen.objects.create(
            estudiante=estudiante,
            examen=examen
        )
        
        # Seleccionar preguntas aleatorias
        preguntas = Pregunta.objects.filter(
            modulo__curso=examen.curso
        ).order_by('?')[:examen.numero_preguntas]
        
        serializer = PreguntaSerializer(preguntas, many=True)
        
        return Response({
            'intento_id': intento.id,
            'duracion_minutos': examen.duracion_minutos,
            'preguntas': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def enviar_respuestas(self, request, pk=None):
        """Enviar respuestas y calificar examen"""
        examen = self.get_object()
        intento_id = request.data.get('intento_id')
        respuestas = request.data.get('respuestas', [])
        
        try:
            intento = IntentoExamen.objects.get(id=intento_id)
        except IntentoExamen.DoesNotExist:
            return Response(
                {'error': 'Intento de examen no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Guardar respuestas y calcular puntaje
        total_puntos = 0
        puntos_obtenidos = 0
        
        for respuesta_data in respuestas:
            pregunta = Pregunta.objects.get(id=respuesta_data['pregunta_id'])
            respuesta_seleccionada = respuesta_data['respuesta']
            
            es_correcta = pregunta.respuesta_correcta == respuesta_seleccionada
            
            RespuestaEstudiante.objects.create(
                intento=intento,
                pregunta=pregunta,
                respuesta_seleccionada=respuesta_seleccionada,
                es_correcta=es_correcta,
                tiempo_respuesta=respuesta_data.get('tiempo', 0)
            )
            
            total_puntos += pregunta.puntos
            if es_correcta:
                puntos_obtenidos += pregunta.puntos
        
        # Calcular porcentaje
        puntaje = (puntos_obtenidos / total_puntos * 100) if total_puntos > 0 else 0
        
        # Actualizar intento
        intento.fecha_fin = timezone.now()
        intento.puntaje_obtenido = round(puntaje, 2)
        intento.completado = True
        intento.aprobado = puntaje >= examen.puntaje_minimo_aprobacion
        intento.tiempo_usado = request.data.get('tiempo_total', 0)
        intento.save()
        
        return Response({
            'puntaje': intento.puntaje_obtenido,
            'aprobado': intento.aprobado,
            'respuestas_correctas': puntos_obtenidos,
            'total_preguntas': total_puntos,
            'tiempo_usado': intento.tiempo_usado
        })