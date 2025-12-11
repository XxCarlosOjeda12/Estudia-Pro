from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import (
    Curso, Modulo, Recurso, Pregunta,
    Inscripcion, ProgresoRecurso, Examen,
    IntentoExamen, RespuestaEstudiante,
    TemaForo, RespuestaForo, VotoRespuesta,
    RecursoComunidad, CalificacionRecurso, DescargaRecurso,
    Formulario, PreguntaFormulario, RespuestaFormulario, DetalleRespuesta
)
from .serializers import (
    CursoListSerializer, CursoDetalleSerializer,
    ModuloSerializer, RecursoSerializer,
    InscripcionSerializer, ProgresoRecursoSerializer,
    PreguntaSerializer, PreguntaConRespuestaSerializer,
    ExamenSerializer, IntentoExamenSerializer,
    RespuestaEstudianteSerializer,
    TemaForoSerializer, TemaForoDetalleSerializer,
    RespuestaForoSerializer,
    RecursoComunidadSerializer, RecursoComunidadDetalleSerializer,
    FormularioSerializer, FormularioDetalleSerializer,
    RespuestaFormularioSerializer
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



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db import models

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mi_panel(request):
    """
    Dashboard principal del estudiante
    """
    if not hasattr(request.user, 'perfil_estudiante'):
        return Response(
            {'error': 'Solo disponible para estudiantes'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    estudiante = request.user.perfil_estudiante
    
    # 1. Mis cursos inscritos
    inscripciones = Inscripcion.objects.filter(
        estudiante=estudiante,
        completado=False
    ).select_related('curso').order_by('-fecha_ultimo_acceso')[:5]
    
    mis_cursos = []
    for inscripcion in inscripciones:
        mis_cursos.append({
            'id': inscripcion.curso.id,
            'titulo': inscripcion.curso.titulo,
            'imagen_portada': inscripcion.curso.imagen_portada,
            'progreso_porcentaje': float(inscripcion.progreso_porcentaje),
            'fecha_ultimo_acceso': inscripcion.fecha_ultimo_acceso,
        })
    
    # 2. Próximos exámenes
    proximos_examenes = IntentoExamen.objects.filter(
        estudiante=estudiante,
        completado=False
    ).select_related('examen__curso')[:3]
    
    examenes_pendientes = []
    for intento in proximos_examenes:
        examenes_pendientes.append({
            'id': intento.examen.id,
            'titulo': intento.examen.titulo,
            'curso': intento.examen.curso.titulo,
            'duracion_minutos': intento.examen.duracion_minutos,
            'fecha_inicio': intento.fecha_inicio,
        })
    
    # 3. Actividad reciente
    actividades_recientes = []
    
    # Últimos recursos completados
    ultimos_progresos = ProgresoRecurso.objects.filter(
        inscripcion__estudiante=estudiante,
        completado=True
    ).select_related('recurso').order_by('-fecha_completado')[:5]
    
    for progreso in ultimos_progresos:
        actividades_recientes.append({
            'tipo': 'recurso_completado',
            'titulo': progreso.recurso.titulo,
            'fecha': progreso.fecha_completado,
            'icono': '📚'
        })
    
    # Últimos exámenes completados
    ultimos_examenes = IntentoExamen.objects.filter(
        estudiante=estudiante,
        completado=True
    ).select_related('examen').order_by('-fecha_fin')[:3]
    
    for intento in ultimos_examenes:
        actividades_recientes.append({
            'tipo': 'examen_completado',
            'titulo': intento.examen.titulo,
            'puntaje': float(intento.puntaje_obtenido),
            'aprobado': intento.aprobado,
            'fecha': intento.fecha_fin,
            'icono': '✅' if intento.aprobado else '❌'
        })
    
    # Ordenar actividades por fecha
    actividades_recientes.sort(
        key=lambda x: x['fecha'],
        reverse=True
    )
    
    # 4. Estadísticas generales
    total_cursos_inscritos = Inscripcion.objects.filter(
        estudiante=estudiante
    ).count()
    
    cursos_completados = Inscripcion.objects.filter(
        estudiante=estudiante,
        completado=True
    ).count()
    
    total_examenes = IntentoExamen.objects.filter(
        estudiante=estudiante,
        completado=True
    ).count()
    
    promedio_examenes = IntentoExamen.objects.filter(
        estudiante=estudiante,
        completado=True
    ).aggregate(promedio=models.Avg('puntaje_obtenido'))['promedio'] or 0
    
    return Response({
        'mis_cursos': mis_cursos,
        'proximos_examenes': examenes_pendientes,
        'actividades_recientes': actividades_recientes[:10],
        'estadisticas': {
            'total_cursos': total_cursos_inscritos,
            'cursos_completados': cursos_completados,
            'total_examenes': total_examenes,
            'promedio_examenes': round(float(promedio_examenes), 2),
            'nivel': request.user.nivel,
            'puntos': request.user.puntos_gamificacion
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_cursos_inscritos(request):
    """
    Listar todos mis cursos inscritos
    """
    if not hasattr(request.user, 'perfil_estudiante'):
        return Response(
            {'error': 'Solo disponible para estudiantes'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    estudiante = request.user.perfil_estudiante
    
    inscripciones = Inscripcion.objects.filter(
        estudiante=estudiante
    ).select_related('curso__creador')
    
    cursos = []
    for inscripcion in inscripciones:
        cursos.append({
            'inscripcion_id': inscripcion.id,
            'curso': CursoListSerializer(inscripcion.curso).data,
            'progreso_porcentaje': float(inscripcion.progreso_porcentaje),
            'completado': inscripcion.completado,
            'fecha_inscripcion': inscripcion.fecha_inscripcion,
            'ultimo_acceso': inscripcion.fecha_ultimo_acceso,
        })
    
    return Response(cursos)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def buscar_cursos(request):
    """
    Buscar y filtrar cursos
    """
    query = request.query_params.get('q', '')
    categoria = request.query_params.get('categoria', '')
    nivel = request.query_params.get('nivel', '')
    es_gratuito = request.query_params.get('gratuito', '')
    
    cursos = Curso.objects.filter(activo=True)
    
    # Filtro de búsqueda por texto
    if query:
        cursos = cursos.filter(
            models.Q(titulo__icontains=query) |
            models.Q(descripcion__icontains=query)
        )
    
    # Filtros adicionales
    if categoria:
        cursos = cursos.filter(categoria=categoria)
    
    if nivel:
        cursos = cursos.filter(nivel=nivel)
    
    if es_gratuito:
        cursos = cursos.filter(es_gratuito=True)
    
    serializer = CursoListSerializer(cursos, many=True)
    return Response({
        'total': cursos.count(),
        'cursos': serializer.data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mi_progreso_detallado(request):
    """
    Vista detallada del progreso del estudiante
    """
    if not hasattr(request.user, 'perfil_estudiante'):
        return Response(
            {'error': 'Solo disponible para estudiantes'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    estudiante = request.user.perfil_estudiante
    
    # 1. Progreso por curso
    inscripciones = Inscripcion.objects.filter(
        estudiante=estudiante
    ).select_related('curso')
    
    progreso_cursos = []
    for inscripcion in inscripciones:
        # Calcular recursos completados
        total_recursos = Recurso.objects.filter(
            modulo__curso=inscripcion.curso
        ).count()
        
        recursos_completados = ProgresoRecurso.objects.filter(
            inscripcion=inscripcion,
            completado=True
        ).count()
        
        # Calcular exámenes
        examenes_curso = IntentoExamen.objects.filter(
            estudiante=estudiante,
            examen__curso=inscripcion.curso,
            completado=True
        )
        
        promedio_examenes = examenes_curso.aggregate(
            promedio=models.Avg('puntaje_obtenido')
        )['promedio'] or 0
        
        progreso_cursos.append({
            'curso_id': inscripcion.curso.id,
            'curso_titulo': inscripcion.curso.titulo,
            'imagen_portada': inscripcion.curso.imagen_portada,
            'progreso_porcentaje': float(inscripcion.progreso_porcentaje),
            'recursos_completados': recursos_completados,
            'total_recursos': total_recursos,
            'total_examenes': examenes_curso.count(),
            'promedio_examenes': round(float(promedio_examenes), 2),
            'completado': inscripcion.completado,
            'fecha_inscripcion': inscripcion.fecha_inscripcion,
        })
    

    logros_estudiante = LogroEstudiante.objects.filter(
        estudiante=estudiante
    ).select_related('logro')
    
    logros_desbloqueados = []
    logros_en_progreso = []
    
    for logro_est in logros_estudiante:
        serializer = LogroEstudianteSerializer(logro_est)
        if logro_est.desbloqueado:
            logros_desbloqueados.append(serializer.data)
        else:
            logros_en_progreso.append(serializer.data)
    
    # 3. Estadísticas generales
    total_puntos = request.user.puntos_gamificacion
    nivel = request.user.nivel
    
    # Actividad por semana (últimos 7 días)
    from datetime import timedelta
    hace_7_dias = timezone.now() - timedelta(days=7)
    
    actividades_semana = ActividadEstudiante.objects.filter(
        estudiante=estudiante,
        fecha__gte=hace_7_dias
    ).count()
    
    # Tiempo total dedicado (aproximado por recursos completados)
    tiempo_total = ProgresoRecurso.objects.filter(
        inscripcion__estudiante=estudiante,
        completado=True
    ).aggregate(total=models.Sum('tiempo_dedicado'))['total'] or 0
    
    # 4. Historial reciente
    actividades_recientes = ActividadEstudiante.objects.filter(
        estudiante=estudiante
    ).order_by('-fecha')[:20]
    
    actividades_serializer = ActividadEstudianteSerializer(
        actividades_recientes,
        many=True
    )
    
    return Response({
        'progreso_cursos': progreso_cursos,
        'logros_desbloqueados': logros_desbloqueados,
        'logros_en_progreso': logros_en_progreso,
        'estadisticas': {
            'total_puntos': total_puntos,
            'nivel': nivel,
            'total_cursos': len(progreso_cursos),
            'cursos_completados': sum(1 for c in progreso_cursos if c['completado']),
            'actividades_semana': actividades_semana,
            'tiempo_total_minutos': tiempo_total,
            'tiempo_total_horas': round(tiempo_total / 60, 1),
        },
        'actividades_recientes': actividades_serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_logros(request):
    """
    Ver todos los logros disponibles y progreso
    """
    if not hasattr(request.user, 'perfil_estudiante'):
        return Response(
            {'error': 'Solo disponible para estudiantes'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    estudiante = request.user.perfil_estudiante
    
    # Todos los logros activos
    logros = Logro.objects.filter(activo=True)
    
    resultado = []
    for logro in logros:
        # Buscar si el estudiante tiene este logro
        try:
            logro_estudiante = LogroEstudiante.objects.get(
                estudiante=estudiante,
                logro=logro
            )
            serializer = LogroEstudianteSerializer(logro_estudiante)
            resultado.append(serializer.data)
        except LogroEstudiante.DoesNotExist:
            # Logro no iniciado
            resultado.append({
                'logro': LogroSerializer(logro).data,
                'progreso_actual': 0,
                'desbloqueado': False,
                'porcentaje_progreso': 0
            })
    
    return Response(resultado)


from rest_framework import viewsets

class ForoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el foro
    """
    queryset = TemaForo.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TemaForoDetalleSerializer
        return TemaForoSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Ver detalle de un tema (incrementa vistas)"""
        tema = self.get_object()
        tema.vistas += 1
        tema.save()
        return super().retrieve(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Crear tema (asignar autor automáticamente)"""
        serializer.save(autor=self.request.user)
    
    @action(detail=True, methods=['post'])
    def responder(self, request, pk=None):
        """Agregar una respuesta a un tema"""
        tema = self.get_object()
        
        if tema.cerrado:
            return Response(
                {'error': 'Este tema está cerrado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contenido = request.data.get('contenido')
        
        if not contenido:
            return Response(
                {'error': 'El contenido es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        respuesta = RespuestaForo.objects.create(
            tema=tema,
            autor=request.user,
            contenido=contenido
        )
        
        # Actualizar fecha del tema
        tema.save()
        
        serializer = RespuestaForoSerializer(respuesta)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def marcar_resuelto(self, request, pk=None):
        """Marcar tema como resuelto"""
        tema = self.get_object()
        
        if tema.autor != request.user:
            return Response(
                {'error': 'Solo el autor puede marcar como resuelto'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tema.resuelto = True
        tema.save()
        
        return Response({'message': 'Tema marcado como resuelto'})
    
    @action(detail=False, methods=['get'])
    def mis_temas(self, request):
        """Ver mis temas creados"""
        temas = TemaForo.objects.filter(autor=request.user)
        serializer = self.get_serializer(temas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_curso(self, request):
        """Filtrar temas por curso"""
        curso_id = request.query_params.get('curso_id')
        
        if not curso_id:
            return Response(
                {'error': 'Se requiere curso_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        temas = TemaForo.objects.filter(curso_id=curso_id)
        serializer = self.get_serializer(temas, many=True)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def votar_respuesta(request, respuesta_id):
    """
    Votar una respuesta del foro
    """
    tipo_voto = request.data.get('tipo')  # 'UP' o 'DOWN'
    
    if tipo_voto not in ['UP', 'DOWN']:
        return Response(
            {'error': 'Tipo de voto inválido'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        respuesta = RespuestaForo.objects.get(id=respuesta_id)
    except RespuestaForo.DoesNotExist:
        return Response(
            {'error': 'Respuesta no encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verificar si ya votó
    voto_existente = VotoRespuesta.objects.filter(
        respuesta=respuesta,
        usuario=request.user
    ).first()
    
    if voto_existente:
        # Cambiar voto o eliminarlo si es el mismo
        if voto_existente.tipo == tipo_voto:
            # Eliminar voto
            voto_existente.delete()
            respuesta.votos += 1 if tipo_voto == 'DOWN' else -1
            mensaje = 'Voto eliminado'
        else:
            # Cambiar voto
            voto_existente.tipo = tipo_voto
            voto_existente.save()
            respuesta.votos += 2 if tipo_voto == 'UP' else -2
            mensaje = 'Voto actualizado'
    else:
        # Crear nuevo voto
        VotoRespuesta.objects.create(
            respuesta=respuesta,
            usuario=request.user,
            tipo=tipo_voto
        )
        respuesta.votos += 1 if tipo_voto == 'UP' else -1
        mensaje = 'Voto registrado'
    
    respuesta.save()
    
    return Response({
        'message': mensaje,
        'total_votos': respuesta.votos
    })


# ========== Recursos de Comunidad ==========

class RecursoComunidadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para recursos de comunidad
    """
    queryset = RecursoComunidad.objects.filter(activo=True, aprobado=True)
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RecursoComunidadDetalleSerializer
        return RecursoComunidadSerializer
    
    def perform_create(self, serializer):
        """Crear recurso (asignar autor automáticamente)"""
        serializer.save(autor=self.request.user, aprobado=False)
    
    @action(detail=True, methods=['post'])
    def descargar(self, request, pk=None):
        """Registrar descarga de recurso"""
        recurso = self.get_object()
        
        # Registrar descarga
        DescargaRecurso.objects.create(
            recurso=recurso,
            usuario=request.user
        )
        
        # Incrementar contador
        recurso.descargas += 1
        recurso.save()
        
        return Response({
            'message': 'Descarga registrada',
            'total_descargas': recurso.descargas,
            'url': recurso.archivo_url
        })
    
    @action(detail=True, methods=['post'])
    def calificar(self, request, pk=None):
        """Calificar un recurso"""
        recurso = self.get_object()
        calificacion_valor = request.data.get('calificacion')
        comentario = request.data.get('comentario', '')
        
        if not calificacion_valor or calificacion_valor not in [1, 2, 3, 4, 5]:
            return Response(
                {'error': 'Calificación debe ser entre 1 y 5'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear o actualizar calificación
        calificacion, created = CalificacionRecurso.objects.update_or_create(
            recurso=recurso,
            usuario=request.user,
            defaults={
                'calificacion': calificacion_valor,
                'comentario': comentario
            }
        )
        
        # Recalcular promedio
        promedio = CalificacionRecurso.objects.filter(
            recurso=recurso
        ).aggregate(promedio=models.Avg('calificacion'))['promedio']
        
        recurso.calificacion_promedio = round(promedio, 2)
        recurso.save()
        
        return Response({
            'message': 'Calificación registrada' if created else 'Calificación actualizada',
            'calificacion_promedio': float(recurso.calificacion_promedio)
        })
    
    @action(detail=False, methods=['get'])
    def mis_recursos(self, request):
        """Ver mis recursos subidos"""
        recursos = RecursoComunidad.objects.filter(autor=request.user)
        serializer = self.get_serializer(recursos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_curso(self, request):
        """Filtrar recursos por curso"""
        curso_id = request.query_params.get('curso_id')
        
        if not curso_id:
            return Response(
                {'error': 'Se requiere curso_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        recursos = self.queryset.filter(curso_id=curso_id)
        serializer = self.get_serializer(recursos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def buscar(self, request):
        """Buscar recursos"""
        query = request.query_params.get('q', '')
        tipo = request.query_params.get('tipo', '')
        
        recursos = self.queryset
        
        if query:
            recursos = recursos.filter(
                models.Q(titulo__icontains=query) |
                models.Q(descripcion__icontains=query)
            )
        
        if tipo:
            recursos = recursos.filter(tipo=tipo)
        
        # Ordenar por calificación
        recursos = recursos.order_by('-calificacion_promedio', '-descargas')
        
        serializer = self.get_serializer(recursos, many=True)
        return Response(serializer.data)


# ========== Formularios ==========

class FormularioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para formularios y encuestas
    """
    queryset = Formulario.objects.filter(activo=True)
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return FormularioDetalleSerializer
        return FormularioSerializer
    
    def perform_create(self, serializer):
        """Crear formulario (solo creadores y admins)"""
        if not (hasattr(self.request.user, 'perfil_creador') or 
                hasattr(self.request.user, 'perfil_administrador')):
            return Response(
                {'error': 'Solo creadores y administradores pueden crear formularios'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save(creador=self.request.user)
    
    @action(detail=True, methods=['post'])
    def responder(self, request, pk=None):
        """Responder un formulario"""
        formulario = self.get_object()
        
        # Verificar si ya respondió (si no es anónimo)
        if not formulario.anonimo:
            if RespuestaFormulario.objects.filter(
                formulario=formulario,
                usuario=request.user
            ).exists():
                return Response(
                    {'error': 'Ya has respondido este formulario'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Validar que el formulario esté activo
        if formulario.fecha_cierre and timezone.now() > formulario.fecha_cierre:
            return Response(
                {'error': 'Este formulario ya está cerrado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear respuesta
        respuestas_data = request.data.get('respuestas', [])
        
        serializer = RespuestaFormularioSerializer(
            data={
                'formulario': formulario.id,
                'detalles': respuestas_data
            },
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Respuesta registrada exitosamente'},
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def resultados(self, request, pk=None):
        """Ver resultados de un formulario (solo creador)"""
        formulario = self.get_object()
        
        if formulario.creador != request.user:
            return Response(
                {'error': 'Solo el creador puede ver los resultados'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        respuestas = RespuestaFormulario.objects.filter(
            formulario=formulario
        ).prefetch_related('detalles')
        
        # Estadísticas por pregunta
        preguntas = formulario.preguntas.all()
        estadisticas = []
        
        for pregunta in preguntas:
            detalles = DetalleRespuesta.objects.filter(pregunta=pregunta)
            
            if pregunta.tipo == 'ESCALA' or pregunta.tipo == 'OPCION_MULTIPLE':
                # Contar opciones
                from collections import Counter
                opciones_count = Counter([
                    d.respuesta_opcion for d in detalles if d.respuesta_opcion
                ])
                
                estadisticas.append({
                    'pregunta': pregunta.texto_pregunta,
                    'tipo': pregunta.tipo,
                    'total_respuestas': detalles.count(),
                    'distribución': dict(opciones_count)
                })
            else:
                # Respuestas de texto
                estadisticas.append({
                    'pregunta': pregunta.texto_pregunta,
                    'tipo': pregunta.tipo,
                    'total_respuestas': detalles.count(),
                    'respuestas': [d.respuesta_texto for d in detalles if d.respuesta_texto][:10]  # Primeras 10
                })
        
        return Response({
            'total_respuestas': respuestas.count(),
            'estadisticas': estadisticas
        })
    
    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """Formularios disponibles para responder"""
        # Formularios activos y no vencidos
        formularios = Formulario.objects.filter(
            activo=True
        ).filter(
            models.Q(fecha_cierre__isnull=True) |
            models.Q(fecha_cierre__gt=timezone.now())
        )
        
        # Excluir los que ya respondió (si no son anónimos)
        if hasattr(request.user, 'perfil_estudiante'):
            respondidos = RespuestaFormulario.objects.filter(
                usuario=request.user
            ).values_list('formulario_id', flat=True)
            
            formularios = formularios.exclude(id__in=respondidos)
        
        serializer = self.get_serializer(formularios, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def mis_formularios(self, request):
        """Formularios que he creado"""
        formularios = Formulario.objects.filter(creador=request.user)
        serializer = self.get_serializer(formularios, many=True)
        return Response(serializer.data)