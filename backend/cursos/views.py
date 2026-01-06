import json
import unicodedata
from django.db import models
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils import timezone
from usuarios.models import Creador
from .models import (
    Curso, Modulo, Recurso, Pregunta,
    Inscripcion, ProgresoRecurso, Examen,
    IntentoExamen, RespuestaEstudiante,
    Logro, LogroEstudiante, ActividadEstudiante,  
    ProximaActividad,
    TutorPerfil, Tutoria, Notificacion,
    TemaForo, RespuestaForo, VotoRespuesta,
    RecursoComunidad, CalificacionRecurso, DescargaRecurso,
    Formulario, PreguntaFormulario, RespuestaFormulario, DetalleRespuesta,
    FormularioEstudio
)
from .serializers import (
    CursoListSerializer, CursoDetalleSerializer,
    ModuloSerializer, RecursoSerializer,
    InscripcionSerializer, ProgresoRecursoSerializer,
    PreguntaSerializer, PreguntaConRespuestaSerializer,
    ExamenSerializer, IntentoExamenSerializer,
    RespuestaEstudianteSerializer,
    LogroSerializer, LogroEstudianteSerializer, ActividadEstudianteSerializer,  
    ProximaActividadSerializer,
    TutorPublicSerializer, TutorPerfilMeSerializer, TutoriaCreateSerializer,
    NotificacionSerializer,
    TemaForoSerializer, TemaForoDetalleSerializer,
    RespuestaForoSerializer,
    RecursoComunidadSerializer, RecursoComunidadDetalleSerializer,
    FormularioEstudioSerializer,
    FormularioSerializer, FormularioDetalleSerializer,
    RespuestaFormularioSerializer
)
from datetime import timedelta


def _serialize_user_basic(user):
    """Normaliza datos bÃƒÆ’Ã‚Â¡sicos del usuario para respuestas rÃƒÆ’Ã‚Â¡pidas."""
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'rol': user.rol,
        'foto_perfil_url': getattr(user, 'foto_perfil_url', None),
        'nivel': getattr(user, 'nivel', 1),
        'puntos_gamificacion': getattr(user, 'puntos_gamificacion', 0),
        'streak': getattr(user, 'streak', 0) or 0,
        'is_premium': getattr(user, 'is_premium', False),
    }


def _recalcular_progreso_inscripcion(inscripcion):
    """
    Recalcula el progreso de una inscripción basándose en:
    - Recursos completados
    - Exámenes aprobados
    Retorna el porcentaje actualizado.
    """
    curso = inscripcion.curso
    estudiante = inscripcion.estudiante
    
    # Contar recursos totales y completados
    total_recursos = Recurso.objects.filter(modulo__curso=curso).count()
    recursos_completados = ProgresoRecurso.objects.filter(
        inscripcion=inscripcion,
        completado=True
    ).count()
    
    # Contar exámenes del curso y aprobados
    examenes_curso = Examen.objects.filter(curso=curso, activo=True)
    total_examenes = examenes_curso.count()
    
    examenes_aprobados = 0
    for examen in examenes_curso:
        mejor_intento = IntentoExamen.objects.filter(
            estudiante=estudiante,
            examen=examen,
            completado=True
        ).order_by('-puntaje_obtenido').first()
        
        if mejor_intento and mejor_intento.puntaje_obtenido >= examen.puntaje_minimo_aprobacion:
            examenes_aprobados += 1
    
    # Calcular progreso ponderado
    # 60% recursos, 40% exámenes (si hay exámenes, sino 100% recursos)
    if total_examenes > 0 and total_recursos > 0:
        progreso_recursos = (recursos_completados / total_recursos) * 60
        progreso_examenes = (examenes_aprobados / total_examenes) * 40
        porcentaje = progreso_recursos + progreso_examenes
    elif total_recursos > 0:
        porcentaje = (recursos_completados / total_recursos) * 100
    elif total_examenes > 0:
        porcentaje = (examenes_aprobados / total_examenes) * 100
    else:
        porcentaje = 0
    
    # Actualizar inscripción
    inscripcion.progreso_porcentaje = round(porcentaje, 2)
    inscripcion.completado = porcentaje >= 100
    inscripcion.save(update_fields=['progreso_porcentaje', 'completado'])
    
    return float(inscripcion.progreso_porcentaje)


def _course_to_catalog(curso, user=None):
    """Convierte un curso al formato esperado por el frontend."""
    progress = 0
    if user and hasattr(user, 'perfil_estudiante'):
        insc = Inscripcion.objects.filter(estudiante=user.perfil_estudiante, curso=curso).first()
        if insc:
            # Recalcular progreso en tiempo real
            progress = _recalcular_progreso_inscripcion(insc)

    profesor = (curso.profesor or '').strip()
    if not profesor:
        try:
            creator_user = getattr(curso.creador, 'id_usuario', None)
            if creator_user:
                full_name = f"{creator_user.first_name} {creator_user.last_name}".strip()
                profesor = full_name or creator_user.username
        except Exception:
            profesor = 'Profesor'
    escuela = curso.escuela or 'ESCOM'

    temario = [{'title': modulo.titulo, 'description': modulo.descripcion} for modulo in curso.modulos.all().order_by('orden')]

    return {
        'id': curso.id,
        'title': curso.titulo,
        'description': curso.descripcion,
        'professor': profesor,
        'school': escuela,
        'progress': progress,
        'level': curso.get_nivel_display() if hasattr(curso, 'get_nivel_display') else curso.nivel,
        'temario': temario,
        'imagen_portada': getattr(curso, 'imagen_portada', None),
    }


def _parse_temario(raw_temario):
    """Convierte el payload de temario del frontend a una lista de dicts."""
    if raw_temario is None:
        return []
    if isinstance(raw_temario, str):
        try:
            raw_temario = json.loads(raw_temario)
        except Exception:
            raw_temario = [item.strip() for item in raw_temario.split('\n') if item.strip()]
    if not isinstance(raw_temario, (list, tuple)):
        return []
    parsed = []
    for idx, item in enumerate(raw_temario):
        if isinstance(item, dict):
            title = item.get('title') or item.get('titulo') or ''
            description = item.get('description') or item.get('descripcion') or ''
        else:
            title = str(item)
            description = ''
        title = title.strip()
        if not title:
            continue
        parsed.append({'title': title, 'description': description.strip(), 'order': idx})
    return parsed


def _replace_course_modules(curso, temario_data):
    """Reemplaza los mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³dulos del curso con el temario recibido."""
    modules = _parse_temario(temario_data)
    curso.modulos.all().delete()
    for item in modules:
        Modulo.objects.create(
            curso=curso,
            titulo=item['title'],
            descripcion=item.get('description', ''),
            orden=item.get('order', 0)
        )


def _serialize_market_resource(recurso):
    """Mapea un recurso acadÃƒÆ’Ã‚Â©mico al formato de la tienda."""
    curso = recurso.modulo.curso if recurso.modulo else None
    subject_id = curso.id if curso else None
    subject_name = curso.titulo if curso else 'General'

    autor = 'Equipo'
    try:
        creator_user = getattr(curso.creador, 'id_usuario', None) if curso else None
        if creator_user:
            autor = f"{creator_user.first_name} {creator_user.last_name}".strip() or creator_user.username
    except Exception:
        pass

    tipo_map = {
        'VIDEO': 'video',
        'PDF': 'pdf',
        'LECTURA': 'pdf',
        'EJERCICIO': 'exam'
    }
    normalized_type = tipo_map.get(getattr(recurso, 'tipo', '').upper(), 'pdf')

    return {
        'id': f"res-{recurso.id}",
        'title': recurso.titulo,
        'description': recurso.descripcion,
        'author': autor,
        'subjectId': subject_id,
        'subjectName': subject_name,
        'type': normalized_type,
        'price': 0,
        'rating': 5.0,
        'downloads': 0,
        'free': True,
        'archivo_url': recurso.contenido_url,
        'contenido_url': recurso.contenido_url,
    }


def _normalize_difficulty_code(value: str) -> str:
    """Normaliza diferentes variantes de dificultad a un código único."""
    raw = (value or '').strip().upper()
    mapping = {
        'INTERMEDIO': 'MEDIA',
        'INTERMEDIA': 'MEDIA',
        'AVANZADO': 'DIFICIL',
        'AVANZADA': 'DIFICIL',
        'BASICO': 'FACIL',
        'BÁSICO': 'FACIL',
    }
    return mapping.get(raw, raw)


def _difficulty_label(code: str) -> str:
    labels = {
        'FACIL': 'Fácil',
        'MEDIA': 'Intermedio',
        'DIFICIL': 'Avanzado'
    }
    return labels.get(code, code.title())


def _default_simulator_banks():
    """Banco de preguntas por defecto por curso y dificultad (centralizado en backend)."""
    return {
        'calculo diferencial': [
            {
                'text': 'Calcula la derivada de f(x)=3x^4-5x^2+2',
                'options': ['12x^3-10x', '12x^3-5x', '3x^3-10x', '3x^4-10x'],
                'answer': 'A',
                'difficulty': 'FACIL',
                'explanation': 'Deriva cada término y agrupa.'
            },
            {
                'text': 'Evalúa el límite lim_{x→0} (sin(3x))/x',
                'options': ['1', '2', '3', '0'],
                'answer': 'C',
                'difficulty': 'MEDIA',
                'explanation': 'Usa sin(kx)/(x)=k cuando x→0.'
            },
            {
                'text': 'Encuentra la pendiente de la tangente a f(x)=e^{x} en x=0',
                'options': ['0', '1', 'e', '2'],
                'answer': 'B',
                'difficulty': 'MEDIA',
                'explanation': "f'(x)=e^{x}; en x=0 es 1."
            },
            {
                'text': 'Aplica la regla de L’Hôpital al límite lim_{x→0} (ln(1+x))/x',
                'options': ['0', '1', 'e', 'No existe'],
                'answer': 'B',
                'difficulty': 'DIFICIL',
                'explanation': 'Deriva numerador y denominador; queda 1.'
            },
            {
                'text': 'Determina la derivada de y=ln(x^2+1)',
                'options': ['2x/(x^2+1)', '1/(x^2+1)', '2/(x^2+1)', 'x/(x^2+1)'],
                'answer': 'A',
                'difficulty': 'FACIL',
                'explanation': 'Cadena: (1/(x^2+1))*2x.'
            }
        ],
        'calculo integral': [
            {
                'text': 'Evalúa la integral definida ∫_0^1 2x dx',
                'options': ['1', '2', '0', '3'],
                'answer': 'A',
                'difficulty': 'FACIL',
                'explanation': 'x^2 de 0 a 1 es 1.'
            },
            {
                'text': 'Resuelve ∫ e^{3x} dx',
                'options': ['(1/3)e^{3x}+C', '3e^{3x}+C', 'e^{3x}+C', '(1/9)e^{3x}+C'],
                'answer': 'A',
                'difficulty': 'MEDIA',
                'explanation': 'Divide por la derivada interna (3).'
            },
            {
                'text': 'Calcula el área bajo y = x^2 de 0 a 2',
                'options': ['4/3', '8/3', '2', '16/3'],
                'answer': 'B',
                'difficulty': 'MEDIA',
                'explanation': '∫_0^2 x^2 dx = [x^3/3]_0^2 = 8/3.'
            },
            {
                'text': 'Usa integración por partes para ∫ x·e^{x} dx',
                'options': ['x e^{x}-e^{x}+C', 'e^{x}-x e^{x}+C', 'x e^{x}+C', 'e^{x}+C'],
                'answer': 'A',
                'difficulty': 'DIFICIL',
                'explanation': 'u=x, dv=e^{x}dx → u\'=1, v=e^{x}.'
            },
            {
                'text': 'Aplica sustitución a ∫ (2x)/(x^2+1) dx',
                'options': ['ln(x^2+1)+C', '(1/2)ln(x^2+1)+C', 'arctan(x)+C', 'x/(x^2+1)+C'],
                'answer': 'A',
                'difficulty': 'FACIL',
                'explanation': 'u=x^2+1, du=2x dx.'
            }
        ]
    }



class CursoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar cursos (Materias)
    """
    queryset = Curso.objects.filter(activo=True)
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        cursos = self.get_queryset().select_related('creador__id_usuario').prefetch_related('modulos')
        data = [_course_to_catalog(curso, request.user) for curso in cursos]
        return Response(data)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CursoDetalleSerializer
        return CursoListSerializer

    def perform_create(self, serializer):
        if self.request.user.rol != 'ADMINISTRADOR':
            raise PermissionDenied('Solo administradores pueden crear cursos')
        if hasattr(self.request.user, 'perfil_creador'):
            curso = serializer.save(creador=self.request.user.perfil_creador)
        else:
            first_creator = Creador.objects.first()
            if first_creator:
                curso = serializer.save(creador=first_creator)
            else:
                raise PermissionDenied('No hay perfil de Creador disponible para asignar al curso.')
        extra_prof = self.request.data.get('professor') or self.request.data.get('profesor')
        extra_school = self.request.data.get('school') or self.request.data.get('escuela')
        extra_level = self.request.data.get('level') or self.request.data.get('nivel')
        updated_fields = []
        if extra_prof is not None:
            curso.profesor = str(extra_prof)
            updated_fields.append('profesor')
        if extra_school is not None:
            curso.escuela = str(extra_school)
            updated_fields.append('escuela')
        if extra_level is not None:
            curso.nivel = str(extra_level).upper()
            updated_fields.append('nivel')
        if updated_fields:
            curso.save(update_fields=updated_fields)
        temario_payload = self.request.data.get('temario') if 'temario' in self.request.data else (self.request.data.get('modules') if 'modules' in self.request.data else None)
        if temario_payload is not None:
            _replace_course_modules(curso, temario_payload)

    def perform_update(self, serializer):
        if self.request.user.rol != 'ADMINISTRADOR':
            raise PermissionDenied('Solo administradores pueden editar cursos')
        curso = serializer.save()
        extra_prof = self.request.data.get('professor') or self.request.data.get('profesor')
        extra_school = self.request.data.get('school') or self.request.data.get('escuela')
        extra_level = self.request.data.get('level') or self.request.data.get('nivel')
        updated_fields = []
        if extra_prof is not None:
            curso.profesor = str(extra_prof)
            updated_fields.append('profesor')
        if extra_school is not None:
            curso.escuela = str(extra_school)
            updated_fields.append('escuela')
        if extra_level is not None:
            curso.nivel = str(extra_level).upper()
            updated_fields.append('nivel')
        if updated_fields:
            curso.save(update_fields=updated_fields)
        _replace_course_modules(curso, self.request.data.get('temario') or self.request.data.get('modules'))

    def perform_destroy(self, instance):
        if self.request.user.rol != 'ADMINISTRADOR':
             raise PermissionDenied('Solo administradores pueden eliminar cursos')
        instance.delete()
    
    @action(detail=True, methods=['get'])
    def modulos(self, request, pk=None):
        """Obtener mÃƒÆ’Ã‚Â³dulos de un curso"""
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
        
        # Verificar si ya estÃƒÆ’Ã‚Â¡ inscrito
        if Inscripcion.objects.filter(estudiante=estudiante, curso=curso).exists():
            return Response(
                {'error': 'Ya estÃƒÆ’Ã‚Â¡s inscrito en este curso'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear inscripciÃƒÆ’Ã‚Â³n
        inscripcion = Inscripcion.objects.create(
            estudiante=estudiante,
            curso=curso
        )
        
        serializer = InscripcionSerializer(inscripcion)
        return Response(
            {
                'message': 'InscripciÃƒÆ’Ã‚Â³n exitosa',
                'inscripcion': serializer.data
            },
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def desinscribirse(self, request, pk=None):
        """Dar de baja al estudiante de un curso"""
        curso = self.get_object()

        if not hasattr(request.user, 'perfil_estudiante'):
            return Response(
                {'error': 'Solo los estudiantes pueden darse de baja de cursos'},
                status=status.HTTP_403_FORBIDDEN
            )

        estudiante = request.user.perfil_estudiante
        inscripcion = Inscripcion.objects.filter(estudiante=estudiante, curso=curso).first()
        if not inscripcion:
            return Response(
                {'error': 'No estÃƒÆ’Ã‚Â¡s inscrito en este curso'},
                status=status.HTTP_400_BAD_REQUEST
            )

        inscripcion.delete()
        ProximaActividad.objects.filter(estudiante=estudiante, curso=curso).delete()

        return Response({'success': True})
    
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

            progresos = ProgresoRecurso.objects.filter(inscripcion=inscripcion)
            progreso_map = {p.recurso_id: p for p in progresos}

            total_recursos = Recurso.objects.filter(modulo__curso=curso).count()
            recursos_completados = len([p for p in progresos if p.completado])
            porcentaje = (recursos_completados / total_recursos * 100) if total_recursos > 0 else 0

            inscripcion.progreso_porcentaje = round(porcentaje, 2)
            inscripcion.save(update_fields=['progreso_porcentaje'])

            modulos_data = []
            for modulo in curso.modulos.all().order_by('orden'):
                recursos_data = []
                modulo_completado = True
                for recurso in modulo.recursos.all().order_by('orden'):
                    progreso_recurso = progreso_map.get(recurso.id)
                    completado = progreso_recurso.completado if progreso_recurso else False
                    recursos_data.append({
                        'id': recurso.id,
                        'titulo': recurso.titulo,
                        'completado': completado
                    })
                    if not completado:
                        modulo_completado = False

                modulos_data.append({
                    'id': modulo.id,
                    'titulo': modulo.titulo,
                    'completado': modulo_completado if modulo.recursos.exists() else False,
                    'recursos': recursos_data
                })

            return Response({
                'progreso_asignatura': {
                    'id': curso.id,
                    'titulo': curso.titulo,
                    'completado_porcentaje': inscripcion.progreso_porcentaje,
                    'fecha_inicio': inscripcion.fecha_inscripcion.date().isoformat()
                },
                'modulos': modulos_data
            })

        except Inscripcion.DoesNotExist:
            return Response(
                {'error': 'No estÃƒÆ’Ã‚Â¡s inscrito en este curso'},
                status=status.HTTP_404_NOT_FOUND
            )


class RecursoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para ver recursos de aprendizaje
    """
    queryset = Recurso.objects.all()
    serializer_class = RecursoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        recursos = self.get_queryset().select_related('modulo__curso__creador__id_usuario')
        data = [_serialize_market_resource(r) for r in recursos]
        return Response(data)
    
    @action(detail=False, methods=['get'], url_path='mis-compras')
    def mis_compras(self, request):
        """
        Lista simulada de recursos comprados para el usuario autenticado.
        Nota: Se devuelven todos los recursos porque no hay lÃƒÆ’Ã‚Â³gica de compra real todavÃƒÆ’Ã‚Â­a.
        """
        recursos = self.get_queryset().select_related('modulo__curso__creador__id_usuario')
        data = [_serialize_market_resource(r) for r in recursos]
        return Response(data)
    
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
        
        # Obtener o crear inscripciÃƒÆ’Ã‚Â³n
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
        
        # Recalcular progreso general de la inscripción
        nuevo_progreso = _recalcular_progreso_inscripcion(inscripcion)
        
        return Response({
            'message': 'Recurso marcado como completado',
            'progreso': ProgresoRecursoSerializer(progreso).data,
            'progreso_curso': nuevo_progreso
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recursos_mis_compras(request):
    """Recursos marcados como comprados (simulado)."""
    recursos = Recurso.objects.all()
    data = [_serialize_market_resource(r) for r in recursos]
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def recursos_comprar(request):
    """Simula la compra de un recurso."""
    resource_id = request.data.get('resourceId') or request.data.get('id')
    recurso = None
    if resource_id:
        recurso = Recurso.objects.filter(id=str(resource_id).replace('res-', '')).first()
    return Response({
        'success': True,
        'resource': _serialize_market_resource(recurso) if recurso else None
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def recursos_descargar(request):
    """Devuelve la URL de descarga si existe."""
    resource_id = request.data.get('resourceId') or request.data.get('id')
    recurso = None
    if resource_id:
        recurso = Recurso.objects.filter(id=str(resource_id).replace('res-', '')).first()
    url = getattr(recurso, 'contenido_url', None) if recurso else None
    return Response({'success': True, 'url': url})


class PreguntaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para banco de preguntas
    """
    queryset = Pregunta.objects.all()
    serializer_class = PreguntaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def por_modulo(self, request):
        """Obtener preguntas de un mÃƒÆ’Ã‚Â³dulo especÃƒÆ’Ã‚Â­fico"""
        modulo_id = request.query_params.get('modulo_id')
        
        if not modulo_id:
            return Response(
                {'error': 'Se requiere el parÃƒÆ’Ã‚Â¡metro modulo_id'},
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
    """ViewSet para examenes y simuladores"""
    queryset = Examen.objects.filter(activo=True)
    serializer_class = ExamenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _serialize_question(self, pregunta):
        options = [
            pregunta.opcion_a,
            pregunta.opcion_b,
            pregunta.opcion_c,
            pregunta.opcion_d
        ]
        difficulty_code = _normalize_difficulty_code(getattr(pregunta, 'dificultad', ''))
        return {
            'id': pregunta.id,
            'text': pregunta.texto_pregunta,
            'options': options,
            'answer': pregunta.respuesta_correcta,
            'explanation': pregunta.explicacion,
            'difficulty': difficulty_code,
            'difficultyLabel': _difficulty_label(difficulty_code),
            'wolframQuery': pregunta.texto_pregunta
        }

    def _serialize_default_question(self, question_dict, fallback_difficulty, index):
        options = (question_dict.get('options') or question_dict.get('opciones') or ['A', 'B', 'C', 'D'])[:4]
        padded_options = (options + ['A', 'B', 'C', 'D'])[:4]
        difficulty_code = _normalize_difficulty_code(question_dict.get('difficulty') or fallback_difficulty)
        return {
            'id': question_dict.get('id') or f"template-{difficulty_code}-{index+1}",
            'text': question_dict.get('text') or question_dict.get('texto') or f'Pregunta {index + 1}',
            'options': padded_options,
            'answer': question_dict.get('answer', 'A'),
            'explanation': question_dict.get('explanation', ''),
            'difficulty': difficulty_code,
            'difficultyLabel': _difficulty_label(difficulty_code),
            'wolframQuery': question_dict.get('wolframQuery') or question_dict.get('text') or question_dict.get('texto')
        }

    @action(detail=False, methods=['post'], url_path='generar')
    def generar_simulador(self, request):
        """Generar un simulador con preguntas para un curso (solo admin)."""
        if getattr(request.user, 'rol', '').upper() != 'ADMINISTRADOR':
            return Response({'error': 'Solo administradores'}, status=status.HTTP_403_FORBIDDEN)

        course_id = request.data.get('courseId')
        title = request.data.get('title') or 'Simulador de Examen'
        duration = int(request.data.get('duration') or 30)
        passing_score = float(request.data.get('passingScore') or 70)
        questions_payload = request.data.get('questions') or []
        questions_count = int(request.data.get('questionsCount') or len(questions_payload) or 5)
        difficulty_selected = (request.data.get('difficulty') or 'FACIL').upper()

        if not course_id:
            return Response({'error': 'courseId requerido'}, status=status.HTTP_400_BAD_REQUEST)

        curso = get_object_or_404(Curso, id=course_id)
        modulo = curso.modulos.first() or Modulo.objects.create(
            curso=curso,
            titulo='Simulador',
            descripcion='Banco de preguntas generado'
        )

        banks = _default_simulator_banks()
        normalized_title = unicodedata.normalize('NFD', curso.titulo or '').encode('ascii', 'ignore').decode('ascii').lower()
        default_questions = banks.get(normalized_title, [])
        base_questions = questions_payload if isinstance(questions_payload, list) and questions_payload else default_questions
        if not base_questions:
            return Response({'error': 'No hay preguntas para generar'}, status=status.HTTP_400_BAD_REQUEST)

        # Ajustar cantidad y dificultad uniforme
        filtered_by_difficulty = [
            q for q in base_questions
            if _normalize_difficulty_code(q.get('difficulty')) == difficulty_selected
        ]
        source = filtered_by_difficulty if filtered_by_difficulty else base_questions
        target_count = max(5, questions_count)
        questions_data = []
        for idx in range(target_count):
            q = source[idx % len(source)]
            questions_data.append(self._serialize_default_question(q, difficulty_selected, idx))

        # Evita duplicados previos de la misma dificultad en el curso
        difficulty_label = _difficulty_label(difficulty_selected)
        Examen.objects.filter(curso=curso, tipo='SIMULADOR', titulo__icontains=difficulty_label).delete()

        if difficulty_label.lower() not in title.lower():
            title = f"{title} - {difficulty_label}"

        examen = Examen.objects.create(
            curso=curso,
            modulo=modulo,
            titulo=title,
            descripcion='Simulador generado desde panel admin',
            tipo='SIMULADOR',
            duracion_minutos=duration,
            numero_preguntas=len(questions_data),
            puntaje_minimo_aprobacion=passing_score,
            activo=True
        )

        created_questions = []
        for idx, q in enumerate(questions_data):
            opcion_a, opcion_b, opcion_c, opcion_d = (q.get('options') or q.get('opciones') or ['A', 'B', 'C', 'D'])[:4]
            diff_raw = _normalize_difficulty_code(q.get('difficulty') or 'FACIL')
            pregunta = Pregunta.objects.create(
                modulo=modulo,
                texto_pregunta=q.get('text') or q.get('texto') or f'Pregunta {idx+1}',
                opcion_a=opcion_a,
                opcion_b=opcion_b if opcion_b is not None else 'B',
                opcion_c=opcion_c if opcion_c is not None else 'C',
                opcion_d=opcion_d if opcion_d is not None else 'D',
                respuesta_correcta=q.get('answer', 'A'),
                explicacion=q.get('explanation', ''),
                dificultad=diff_raw,
                puntos=int(q.get('points') or 1)
            )
            created_questions.append({
                'id': pregunta.id,
                'text': pregunta.texto_pregunta,
                'difficulty': diff_raw,
                'answer': pregunta.respuesta_correcta,
                'explanation': pregunta.explicacion,
                'wolframQuery': pregunta.texto_pregunta,
                'options': [opcion_a, opcion_b, opcion_c, opcion_d]
            })

        return Response({
            'id': examen.id,
            'title': examen.titulo,
            'subjectId': curso.id,
            'subjectName': curso.titulo,
            'questions': created_questions,
            'difficulty': difficulty_selected,
            'difficultyLabel': difficulty_label
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='plantillas')
    def plantillas(self, request):
        """Devuelve plantillas de preguntas por dificultad para un curso (backend, sin hardcode en frontend)."""
        course_id = request.query_params.get('courseId') or request.query_params.get('cursoId') or request.query_params.get('curso')
        if not course_id:
            return Response({'error': 'courseId requerido'}, status=status.HTTP_400_BAD_REQUEST)

        curso = get_object_or_404(Curso, id=course_id)
        banks = _default_simulator_banks()
        normalized_title = unicodedata.normalize('NFD', curso.titulo or '').encode('ascii', 'ignore').decode('ascii').lower()
        default_questions = banks.get(normalized_title, [])

        preguntas_qs = list(Pregunta.objects.filter(modulo__curso=curso))
        difficulties = ['FACIL', 'MEDIA', 'DIFICIL']
        templates = []

        for code in difficulties:
            # Prioriza preguntas reales del curso
            curso_questions = [self._serialize_question(p) for p in preguntas_qs if _normalize_difficulty_code(p.dificultad) == code]

            # Si no hay suficientes, usa banco por defecto del backend
            fallback = [
                self._serialize_default_question(q, code, idx)
                for idx, q in enumerate(default_questions)
                if _normalize_difficulty_code(q.get('difficulty')) == code
            ]

            combined = curso_questions + fallback
            # Garantizar exactamente 5 preguntas (rellena desde fallback o curso si hay menos)
            if len(combined) < 5:
                seed = fallback or curso_questions
                while len(combined) < 5 and seed:
                    combined.append(seed[len(combined) % len(seed)])
            selected_questions = combined[:5]
            if selected_questions:
                templates.append({
                    'difficulty': code,
                    'label': _difficulty_label(code),
                    'questions': selected_questions
                })

        return Response({
            'courseId': curso.id,
            'courseName': curso.titulo,
            'templates': templates
        })

    def list(self, request, *args, **kwargs):
        exams = self.get_queryset().select_related('curso')
        data = []
        for exam in exams:
            preguntas_qs = Pregunta.objects.filter(modulo__curso=exam.curso)[: max(exam.numero_preguntas, 1)]
            preguntas_data = [self._serialize_question(p) for p in preguntas_qs]
            difficulty_code = preguntas_data[0].get('difficulty') if preguntas_data else None
            difficulty_label = preguntas_data[0].get('difficultyLabel') if preguntas_data else None
            data.append({
                'id': exam.id,
                'subjectId': exam.curso.id if exam.curso else None,
                'subjectName': exam.curso.titulo if exam.curso else None,
                'title': exam.titulo,
                'duration': exam.duracion_minutos * 60,
                'questions': preguntas_data,
                'difficulty': difficulty_code,
                'difficultyLabel': difficulty_label
            })
        return Response(data)

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        examen = self.get_object()
        preguntas_qs = Pregunta.objects.filter(modulo__curso=examen.curso)[: max(examen.numero_preguntas, 1)]
        preguntas_data = [self._serialize_question(p) for p in preguntas_qs]
        return Response({
            'examen': {
                'id': examen.id,
                'title': examen.titulo,
                'duration': examen.duracion_minutos * 60,
                'subjectId': examen.curso.id if examen.curso else None,
                'subjectName': examen.curso.titulo if examen.curso else None,
            },
            'questions': preguntas_data
        })

    @action(detail=True, methods=['post'])
    def enviar_respuestas(self, request, pk=None):
        examen = self.get_object()
        answers = request.data.get('answers') or request.data.get('respuestas') or {}
        if not isinstance(answers, dict):
            return Response({'error': 'answers debe ser un objeto'}, status=status.HTTP_400_BAD_REQUEST)

        preguntas = list(Pregunta.objects.filter(modulo__curso=examen.curso)[: max(examen.numero_preguntas, 1)])
        total = len(preguntas)
        correctas = 0

        def _normalize(expr: str):
            return (expr or '').replace('^', '').replace('{', '').replace('}', '').replace('\\', '').replace(' ', '').lower()

        for pregunta in preguntas:
            user_answer = answers.get(str(pregunta.id)) or answers.get(pregunta.id)
            if user_answer is None:
                continue
            user_norm = _normalize(str(user_answer))

            # Comparar por letra y por texto de la opción correcta
            letra_correcta = str(pregunta.respuesta_correcta).strip().lower()
            texto_correcto = getattr(pregunta, f"opcion_{pregunta.respuesta_correcta.lower()}", '')
            texto_norm = _normalize(texto_correcto)

            if user_norm == letra_correcta or (texto_norm and user_norm == texto_norm):
                correctas += 1

        calificacion = round((correctas / total * 100) if total else 0, 2)

        # Registrar intento
        intento = None
        if hasattr(request.user, 'perfil_estudiante'):
            intento = IntentoExamen.objects.create(
                estudiante=request.user.perfil_estudiante,
                examen=examen,
                puntaje_obtenido=calificacion,
                tiempo_usado=examen.duracion_minutos * 60,
                completado=True,
                aprobado=calificacion >= float(examen.puntaje_minimo_aprobacion or 0),
                fecha_fin=timezone.now()
            )
            # Guardar respuestas (opcional, solo las correctas/incorrectas básicas)
            for pregunta in preguntas:
                user_answer = answers.get(str(pregunta.id)) or answers.get(pregunta.id)
                RespuestaEstudiante.objects.create(
                    intento=intento,
                    pregunta=pregunta,
                    respuesta_seleccionada=str(user_answer or '')[:1],
                    es_correcta=str(user_answer or '').strip().lower() == str(pregunta.respuesta_correcta).strip().lower(),
                    tiempo_respuesta=0
                )
            
            # Recalcular progreso del curso después de completar examen
            inscripcion = Inscripcion.objects.filter(
                estudiante=request.user.perfil_estudiante,
                curso=examen.curso
            ).first()
            if inscripcion:
                _recalcular_progreso_inscripcion(inscripcion)

        return Response({
            'calificacion': calificacion,
            'correctas': correctas,
            'total': total,
            'intento_id': intento.id if intento else None
        })


class ForoViewSet(viewsets.ModelViewSet):
    """ViewSet para foro (temas y respuestas)"""
    queryset = TemaForo.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        temas = self.get_queryset().select_related('curso')
        data = []
        for tema in temas:
            data.append({
                'id': tema.id,
                'title': tema.titulo,
                'subjectName': tema.curso.titulo if tema.curso else 'General',
                'postCount': tema.respuestas.count(),
                'lastActivity': tema.fecha_actualizacion
            })
        return Response(data)

    def retrieve(self, request, *args, **kwargs):
        tema = self.get_object()
        tema.vistas = models.F('vistas') + 1
        tema.save(update_fields=['vistas'])
        tema.refresh_from_db()

        posts = []
        for resp in tema.respuestas.all().order_by('-fecha_creacion'):
            autor = resp.autor
            author_name = f"{autor.first_name} {autor.last_name}".strip() or autor.username
            posts.append({
                'id': resp.id,
                'author': author_name,
                'content': resp.contenido,
                'createdAt': resp.fecha_creacion,
                'votes': resp.votos
            })

        return Response({
            'id': tema.id,
            'title': tema.titulo,
            'subjectName': tema.curso.titulo if tema.curso else 'General',
            'posts': posts
        })

    def create(self, request, *args, **kwargs):
        titulo = request.data.get('titulo') or request.data.get('title')
        contenido = request.data.get('contenido') or request.data.get('content')
        curso_id = request.data.get('curso') or request.data.get('subjectId')
        if not titulo or not contenido:
            return Response({'error': 'titulo y contenido son requeridos'}, status=status.HTTP_400_BAD_REQUEST)
        curso = Curso.objects.filter(id=curso_id).first() if curso_id else None
        tema = TemaForo.objects.create(
            titulo=titulo,
            contenido=contenido,
            categoria=request.data.get('categoria', 'General'),
            autor=request.user,
            curso=curso
        )
        topic_payload = {
            'id': tema.id,
            'title': tema.titulo,
            'subjectName': tema.curso.titulo if tema.curso else 'General',
            'postCount': 0,
            'lastActivity': tema.fecha_actualizacion
        }
        return Response({'success': True, 'topic': topic_payload}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def responder(self, request, pk=None):
        tema = self.get_object()
        if not request.data.get('contenido') and not request.data.get('content'):
            return Response({'error': 'contenido es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        contenido = request.data.get('contenido') or request.data.get('content')
        respuesta = RespuestaForo.objects.create(
            tema=tema,
            autor=request.user,
            contenido=contenido
        )
        post_payload = {
            'id': respuesta.id,
            'author': request.user.username,
            'content': respuesta.contenido,
            'createdAt': respuesta.fecha_creacion,
            'votes': respuesta.votos
        }
        return Response({'success': True, 'post': post_payload}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def votar_respuesta(request, respuesta_id):
    """
    Votar una respuesta del foro
    """
    tipo_voto = request.data.get('tipo') or request.data.get('vote')  # 'UP' o 'DOWN'
    
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
    
    voto_existente = VotoRespuesta.objects.filter(
        respuesta=respuesta,
        usuario=request.user
    ).first()
    
    if voto_existente:
        if voto_existente.tipo == tipo_voto:
            voto_existente.delete()
            respuesta.votos += 1 if tipo_voto == 'DOWN' else -1
            mensaje = 'Voto eliminado'
        else:
            voto_existente.tipo = tipo_voto
            voto_existente.save()
            respuesta.votos += 2 if tipo_voto == 'UP' else -2
            mensaje = 'Voto actualizado'
    else:
        VotoRespuesta.objects.create(
            respuesta=respuesta,
            usuario=request.user,
            tipo=tipo_voto
        )
        respuesta.votos += 1 if tipo_voto == 'UP' else -1
        mensaje = 'Voto registrado'
    
    respuesta.save()
    
    return Response({
        'success': True,
        'message': mensaje,
        'votes': respuesta.votos
    })


class RecursoComunidadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para recursos de comunidad
    """
    queryset = RecursoComunidad.objects.filter(activo=True).order_by('-fecha_creacion')
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RecursoComunidadDetalleSerializer
        return RecursoComunidadSerializer
    
    def perform_create(self, serializer):
        serializer.save(autor=self.request.user, aprobado=True, activo=True)

    def perform_update(self, serializer):
        if self.request.user.rol != 'ADMINISTRADOR' and serializer.instance.autor != self.request.user:
             raise PermissionDenied('No tienes permiso para editar este recurso')
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.rol != 'ADMINISTRADOR' and instance.autor != self.request.user:
             raise PermissionDenied('No tienes permiso para eliminar este recurso')
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def descargar(self, request, pk=None):
        recurso = self.get_object()
        DescargaRecurso.objects.create(
            recurso=recurso,
            usuario=request.user
        )
        recurso.descargas = models.F('descargas') + 1
        recurso.save(update_fields=['descargas'])
        recurso.refresh_from_db()
        
        url = recurso.archivo_url
        if getattr(recurso, 'archivo', None):
            try:
                url = request.build_absolute_uri(recurso.archivo.url)
            except Exception:
                url = recurso.archivo_url

        return Response({
            'message': 'Descarga registrada',
            'total_descargas': recurso.descargas,
            'url': url
        })
    
    @action(detail=True, methods=['post'])
    def calificar(self, request, pk=None):
        recurso = self.get_object()
        calificacion_valor = request.data.get('calificacion')
        comentario = request.data.get('comentario', '')
        
        try:
            calificacion_valor = int(calificacion_valor)
        except (TypeError, ValueError):
            calificacion_valor = None
        
        if calificacion_valor not in [1, 2, 3, 4, 5]:
            return Response(
                {'error': 'Calificación debe ser entre 1 y 5'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        calificacion, created = CalificacionRecurso.objects.update_or_create(
            recurso=recurso,
            usuario=request.user,
            defaults={
                'calificacion': calificacion_valor,
                'comentario': comentario
            }
        )
        
        promedio = CalificacionRecurso.objects.filter(
            recurso=recurso
        ).aggregate(promedio=models.Avg('calificacion'))['promedio'] or 0
        
        recurso.calificacion_promedio = round(promedio, 2)
        recurso.save(update_fields=['calificacion_promedio'])
        
        return Response({
            'message': 'Calificación registrada' if created else 'Calificación actualizada',
            'calificacion_promedio': float(recurso.calificacion_promedio)
        })
    
    @action(detail=False, methods=['get'])
    def mis_recursos(self, request):
        recursos = RecursoComunidad.objects.filter(autor=request.user)
        serializer = self.get_serializer(recursos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_curso(self, request):
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
        
        recursos = recursos.order_by('-calificacion_promedio', '-descargas')
        
        serializer = self.get_serializer(recursos, many=True)
        return Response(serializer.data)


class TutorViewSet(viewsets.ReadOnlyModelViewSet):
    """Listado público de tutores"""
    queryset = TutorPerfil.objects.filter(activo=True)
    serializer_class = TutorPublicSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get', 'put'], url_path='me')
    def me(self, request):
        """Obtener o actualizar el perfil de tutor del creador autenticado."""
        if not hasattr(request.user, 'perfil_creador'):
            return Response({'error': 'Solo disponible para creadores'}, status=status.HTTP_403_FORBIDDEN)

        perfil, _ = TutorPerfil.objects.get_or_create(creador=request.user.perfil_creador)

        if request.method.lower() == 'get':
            serializer = TutorPerfilMeSerializer(perfil)
            return Response(serializer.data)

        serializer = TutorPerfilMeSerializer(perfil, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='agendar')
    def agendar(self, request):
        """Crear una solicitud de tutoria (estudiante)."""
        if not hasattr(request.user, 'perfil_estudiante'):
            return Response({'error': 'Solo disponible para estudiantes'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TutoriaCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tutor_id = serializer.validated_data.get('tutorId')
        subject_id = serializer.validated_data.get('subjectId')
        duration = serializer.validated_data.get('duration') or 30
        topic = serializer.validated_data.get('topic') or ''

        tutor = get_object_or_404(Creador, id_creador=tutor_id)
        curso = get_object_or_404(Curso, id=subject_id) if subject_id else None

        tutoria = Tutoria.objects.create(
            estudiante=request.user.perfil_estudiante,
            tutor=tutor,
            curso=curso,
            duracion_minutos=duration,
            tema=topic,
            estado='SOLICITADA'
        )

        try:
            Notificacion.objects.create(
                usuario=tutor.id_usuario,
                titulo='Nueva solicitud de tutoria',
                mensaje=f"Tienes una solicitud sobre: {topic or (curso.titulo if curso else 'Tutoria')}",
                tipo='info'
            )
            Notificacion.objects.create(
                usuario=request.user,
                titulo='Solicitud enviada',
                mensaje='Tu solicitud de tutoria ha sido registrada.',
                tipo='success'
            )
        except Exception:
            pass

        return Response({'id': tutoria.id, 'estado': tutoria.estado}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['put', 'delete'], url_path=r'solicitudes/(?P<tutoria_id>[^/.]+)/estado')
    def actualizar_solicitud(self, request, tutoria_id=None):
        """Actualizar o cancelar una solicitud de tutoría (solo el tutor correspondiente)."""
        tutoria = get_object_or_404(Tutoria, id=tutoria_id)
        creador = getattr(request.user, 'perfil_creador', None)

        if request.user.rol != 'ADMINISTRADOR' and (not creador or tutoria.tutor != creador):
            return Response({'error': 'No tienes permiso para modificar esta solicitud'}, status=status.HTTP_403_FORBIDDEN)

        if request.method.lower() == 'delete':
            tutoria.estado = 'CANCELADA'
            tutoria.save(update_fields=['estado'])
            return Response({'id': tutoria.id, 'estado': tutoria.estado})

        nuevo_estado = request.data.get('estado') or request.data.get('status')
        estados_validos = dict(Tutoria.ESTADOS).keys()
        if nuevo_estado not in estados_validos:
            return Response({'error': 'Estado no válido'}, status=status.HTTP_400_BAD_REQUEST)

        tutoria.estado = nuevo_estado
        tutoria.save(update_fields=['estado'])

        student_user = getattr(getattr(tutoria, 'estudiante', None), 'id_usuario', None)
        respuesta = {
            'id': tutoria.id,
            'estado': tutoria.estado,
            'student': f"{getattr(student_user, 'first_name', '')} {getattr(student_user, 'last_name', '')}".strip() or getattr(student_user, 'username', '') or 'Estudiante',
            'studentUsername': getattr(student_user, 'username', ''),
            'studentEmail': getattr(student_user, 'email', ''),
            'subject': tutoria.curso.titulo if tutoria.curso else (tutoria.tema or 'Tutoria'),
            'date': timezone.localtime(tutoria.fecha_hora).strftime('%Y-%m-%d %H:%M') if tutoria.fecha_hora else 'Por definir',
            'duration': f"{tutoria.duracion_minutos} min"
        }

        return Response(respuesta)


class NotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    """Notificaciones del usuario"""
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notificacion.objects.filter(usuario=self.request.user)

    @action(detail=False, methods=['post'], url_path='leer')
    def mark_read(self, request):
        """Marcar una notificacion como leida o todas si no se envia id."""
        notif_id = request.data.get('notificationId') or request.data.get('id')
        qs = self.get_queryset()
        if notif_id:
            notif = get_object_or_404(qs, id=notif_id)
            notif.leida = True
            notif.save(update_fields=['leida'])
        else:
            qs.update(leida=True)
        return Response({'success': True})

    @action(detail=False, methods=['post'], url_path='eliminar')
    def delete_one(self, request):
        """Eliminar una notificacion del usuario."""
        notif_id = request.data.get('notificationId') or request.data.get('id')
        if not notif_id:
            return Response({'error': 'notificationId requerido'}, status=status.HTTP_400_BAD_REQUEST)
        notif = get_object_or_404(self.get_queryset(), id=notif_id)
        notif.delete()
        return Response({'success': True})

    @action(detail=False, methods=['post'], url_path='eliminar-todas')
    def delete_all(self, request):
        """Eliminar todas las notificaciones del usuario."""
        self.get_queryset().delete()
        return Response({'success': True})




from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db import models
from datetime import date, time

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mi_panel(request):
    # Dashboard principal
    user = request.user
    base_user = _serialize_user_basic(user)

    # Panel para creadores
    if user.rol == 'CREADOR':
        if not hasattr(user, 'perfil_creador'):
            return Response({'error': 'Perfil de creador no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        creador = user.perfil_creador
        tutorias = Tutoria.objects.filter(tutor=creador).exclude(estado='CANCELADA').order_by('fecha_hora')
        tutoring_list = []
        for t in tutorias:
            student_user = getattr(getattr(t, 'estudiante', None), 'id_usuario', None)
            student_full_name = ''
            student_username = ''
            student_email = ''
            if student_user:
                student_full_name = f"{student_user.first_name} {student_user.last_name}".strip() or student_user.username
                student_username = student_user.username
                student_email = student_user.email

            tutoring_list.append({
                'id': t.id,
                'student': student_full_name or 'Estudiante',
                'studentUsername': student_username,
                'studentEmail': student_email,
                'subject': t.curso.titulo if t.curso else (t.tema or 'Tutoria'),
                'date': timezone.localtime(t.fecha_hora).strftime('%Y-%m-%d %H:%M') if t.fecha_hora else 'Por definir',
                'duration': f"{t.duracion_minutos} min",
                'status': t.estado
            })

        return Response({
            'usuario': base_user,
            'published': RecursoComunidad.objects.filter(autor=user, activo=True).count(),
            'rating': float(creador.calificacion_promedio or 0),
            'studentsHelped': Tutoria.objects.filter(tutor=creador).exclude(estado='CANCELADA').count(),
            'tutoring': tutoring_list
        })

    # Panel para administradores (entregar 200 para evitar loops en frontend)
    if user.rol == 'ADMINISTRADOR':
        return Response({
            'usuario': base_user,
            'published': RecursoComunidad.objects.filter(activo=True).count(),
            'rating': 0,
            'studentsHelped': 0,
            'tutoring': [],
            'pendientes_count': ProximaActividad.objects.count(),
            'nivel_actual': base_user.get('nivel', 1),
            'puntos_totales': base_user.get('puntos_gamificacion', 0),
        })

    # Panel para estudiantes
    if not hasattr(request.user, 'perfil_estudiante'):
        return Response({'error': 'Solo disponible para estudiantes'}, status=status.HTTP_403_FORBIDDEN)

    estudiante = request.user.perfil_estudiante

    inscripciones = Inscripcion.objects.filter(estudiante=estudiante).select_related('curso').order_by('-fecha_ultimo_acceso')

    mis_cursos = []
    for inscripcion in inscripciones[:5]:
        # Recalcular progreso para cada curso
        progreso_actualizado = _recalcular_progreso_inscripcion(inscripcion)
        mis_cursos.append({
            'id': inscripcion.curso.id,
            'titulo': inscripcion.curso.titulo,
            'progreso': progreso_actualizado,
            'imagen_url': inscripcion.curso.imagen_portada
        })

    today = timezone.localdate()
    proximos_examenes = []
    for inscripcion in inscripciones:
        if inscripcion.fecha_examen and inscripcion.fecha_examen >= today:
            proximos_examenes.append({
                'id': inscripcion.curso.id,
                'titulo': f"Examen {inscripcion.curso.titulo}",
                'fecha': inscripcion.fecha_examen.isoformat(),
                'curso_nombre': inscripcion.curso.titulo
            })

    proximas_actividades = ProximaActividad.objects.filter(estudiante=estudiante, fecha__gte=today)

    return Response({
        'usuario': base_user,
        'mis_cursos': mis_cursos,
        'proximos_examenes': proximos_examenes[:5],
        'pendientes_count': proximas_actividades.count(),
        'racha_dias': base_user.get('streak', 0),
        'puntos_totales': base_user.get('puntos_gamificacion', 0),
        'nivel_actual': base_user.get('nivel', 1),
        'tutoring': []
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
        # Recalcular progreso para cada inscripción
        progreso_actualizado = _recalcular_progreso_inscripcion(inscripcion)
        cursos.append({
            'inscripcion_id': inscripcion.id,
            'curso': _course_to_catalog(inscripcion.curso, request.user),
            'progreso_porcentaje': progreso_actualizado,
            'completado': inscripcion.completado,
            'fecha_inscripcion': inscripcion.fecha_inscripcion,
            'ultimo_acceso': inscripcion.fecha_ultimo_acceso,
            'examDate': inscripcion.fecha_examen.isoformat() if inscripcion.fecha_examen else None,
            'examTime': inscripcion.hora_examen.strftime('%H:%M') if inscripcion.hora_examen else None,
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
    
    # Filtro de bÃƒÆ’Ã‚Âºsqueda por texto
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
    
    data = [_course_to_catalog(curso, request.user) for curso in cursos]
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mi_progreso_detallado(request):
    """Progreso detallado del estudiante en sus cursos"""
    if not hasattr(request.user, 'perfil_estudiante'):
        return Response(
            {'error': 'Solo disponible para estudiantes'},
            status=status.HTTP_403_FORBIDDEN
        )
    estudiante = request.user.perfil_estudiante
    inscripciones = Inscripcion.objects.filter(estudiante=estudiante).select_related('curso')

    progreso_cursos = []
    total_minutos = 0
    intentos_historial = []

    for inscripcion in inscripciones:
        curso = inscripcion.curso
        # Recalcular progreso
        progreso_actualizado = _recalcular_progreso_inscripcion(inscripcion)
        
        intentos = IntentoExamen.objects.filter(examen__curso=curso, estudiante=estudiante, completado=True)
        total_examenes = intentos.count()
        promedio_examenes = intentos.aggregate(models.Avg('puntaje_obtenido')).get('puntaje_obtenido__avg') or 0
        minutos_examenes = intentos.aggregate(models.Sum('tiempo_usado')).get('tiempo_usado__sum') or 0
        total_minutos += minutos_examenes

        for intento in intentos:
          intentos_historial.append({
              'curso': curso.titulo,
              'examen': intento.examen.titulo if intento.examen else '',
              'puntaje': float(intento.puntaje_obtenido),
              'fecha': intento.fecha_fin.isoformat() if intento.fecha_fin else intento.fecha_inicio.isoformat(),
              'duracion_minutos': int((intento.tiempo_usado or 0) / 60) if intento.tiempo_usado else 0
          })

        progreso_cursos.append({
            'curso_titulo': curso.titulo,
            'promedio_examenes': float(round(promedio_examenes, 2)),
            'progreso_porcentaje': progreso_actualizado,
            'total_examenes': total_examenes,
            'examDate': inscripcion.fecha_examen.isoformat() if inscripcion.fecha_examen else None,
            'examTime': inscripcion.hora_examen.strftime('%H:%M') if inscripcion.hora_examen else None,
        })

    estadisticas = {
        'nivel': getattr(request.user, 'nivel', 1),
        'total_puntos': getattr(request.user, 'puntos_gamificacion', 0),
        'tiempo_total_minutos': total_minutos,
        'tiempo_total_horas': round(total_minutos / 60, 1),
        'total_cursos': inscripciones.count(),
        'total_intentos': len(intentos_historial)
    }

    return Response({
        'progreso_cursos': progreso_cursos,
        'estadisticas': estadisticas,
        'intentos_historial': sorted(intentos_historial, key=lambda x: x['fecha'], reverse=True)
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def actualizar_fecha_examen(request):
    """
    Guardar (o borrar) la fecha de examen para una materia inscrita
    y mantener sincronizadas las prÃƒÆ’Ã‚Â³ximas actividades.
    """
    if not hasattr(request.user, 'perfil_estudiante'):
        return Response(
            {'error': 'Solo disponible para estudiantes'},
            status=status.HTTP_403_FORBIDDEN
        )

    estudiante = request.user.perfil_estudiante
    subject_id = request.data.get('subjectId') or request.data.get('curso_id') or request.data.get('courseId')
    exam_date_raw = request.data.get('examDate')
    exam_time_raw = request.data.get('examTime')

    if not subject_id:
        return Response({'error': 'subjectId es requerido'}, status=status.HTTP_400_BAD_REQUEST)

    inscripcion = get_object_or_404(Inscripcion, estudiante=estudiante, curso_id=subject_id)

    # Borrar fecha
    if not exam_date_raw:
        inscripcion.fecha_examen = None
        inscripcion.hora_examen = None
        inscripcion.save(update_fields=['fecha_examen', 'hora_examen'])
        ProximaActividad.objects.filter(
            estudiante=estudiante,
            curso_id=inscripcion.curso.id,
            origen='FECHA_EXAMEN'
        ).delete()
        return Response({'success': True, 'examDate': None, 'examTime': None})

    try:
        parsed_date = date.fromisoformat(str(exam_date_raw))
    except ValueError:
        return Response({'error': 'examDate debe ser YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

    parsed_time = None
    if exam_time_raw:
        try:
            # acepta HH:MM o HH:MM:SS
            parsed_time = time.fromisoformat(str(exam_time_raw))
        except ValueError:
            return Response({'error': 'examTime debe ser HH:MM (opcional)'}, status=status.HTTP_400_BAD_REQUEST)

    inscripcion.fecha_examen = parsed_date
    inscripcion.hora_examen = parsed_time
    inscripcion.save(update_fields=['fecha_examen', 'hora_examen'])

    ProximaActividad.objects.update_or_create(
        estudiante=estudiante,
        curso=inscripcion.curso,
        origen='FECHA_EXAMEN',
        defaults={
            'titulo': inscripcion.curso.titulo,
            'tipo': 'EXAMEN',
            'fecha': parsed_date,
            'hora': parsed_time,
        }
    )

    return Response(
        {
            'success': True,
            'examDate': parsed_date.isoformat(),
            'examTime': parsed_time.strftime('%H:%M') if parsed_time else None,
        }
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def lista_logros(request):
    """Lista de logros disponibles (catálogo)."""
    logros = Logro.objects.filter(activo=True)
    data = [{
        'id': logro.id,
        'title': logro.nombre,
        'description': logro.descripcion,
        'icon': logro.icono,
        'date': None,
    } for logro in logros]
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mis_logros(request):
    """Ver todos los logros disponibles y progreso del estudiante"""
    if not hasattr(request.user, 'perfil_estudiante'):
        return Response(
            {'error': 'Solo disponible para estudiantes'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    estudiante = request.user.perfil_estudiante
    logros = Logro.objects.filter(activo=True)
    
    resultado = []
    for logro in logros:
        try:
            logro_estudiante = LogroEstudiante.objects.get(
                estudiante=estudiante,
                logro=logro
            )
            serializer = LogroEstudianteSerializer(logro_estudiante)
            resultado.append(serializer.data)
        except LogroEstudiante.DoesNotExist:
            resultado.append({
                'logro': LogroSerializer(logro).data,
                'progreso_actual': 0,
                'desbloqueado': False,
                'porcentaje_progreso': 0
            })
    
    return Response(resultado)


class ProximaActividadViewSet(viewsets.ModelViewSet):
    serializer_class = ProximaActividadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not hasattr(self.request.user, 'perfil_estudiante'):
            return ProximaActividad.objects.none()
        estudiante = self.request.user.perfil_estudiante
        return ProximaActividad.objects.filter(estudiante=estudiante)

    def list(self, request, *args, **kwargs):
        today = timezone.localdate()
        queryset = self.get_queryset().filter(fecha__gte=today).order_by('fecha', 'hora', 'id')
        serializer = self.get_serializer(queryset, many=True)
        data = list(serializer.data)
        
        # Incorporar TutorÃƒÆ’Ã‚Â­as PrÃƒÆ’Ã‚Â³ximas
        if hasattr(request.user, 'perfil_estudiante'):
            tutorias = Tutoria.objects.filter(
                estudiante=request.user.perfil_estudiante,
                fecha_hora__gt=timezone.now()
            ).exclude(estado='CANCELADA')
            
            for t in tutorias:
                 local_dt = timezone.localtime(t.fecha_hora)
                 data.append({
                     'id': f"tut-{t.id}",
                     'titulo': f"Tutoria: {t.curso.titulo if t.curso else (t.tema or 'General')}",
                     'tipo': 'TUTORIA',
                     'fecha': local_dt.date().isoformat(),
                     'hora': local_dt.time().strftime('%H:%M'),
                     'origen': 'AUTOMATICO',
                     'curso_id': t.curso.id if t.curso else None,
                     'curso_titulo': t.curso.titulo if t.curso else None
                 })
        
        # Ordenar mezclado
        data.sort(key=lambda x: f"{x.get('fecha') or x.get('date')}T{(x.get('hora') or x.get('time') or '00:00')}")
        
        return Response(data)

    def perform_create(self, serializer):
        if self.request.user.rol != 'ADMINISTRADOR':
            raise PermissionDenied('Solo administradores pueden crear cursos')
        if hasattr(self.request.user, 'perfil_creador'):
            curso = serializer.save(creador=self.request.user.perfil_creador)
        else:
            first_creator = Creador.objects.first()
            if first_creator:
                curso = serializer.save(creador=first_creator)
            else:
                raise PermissionDenied('No hay perfil de Creador disponible para asignar al curso.')
        extra_prof = self.request.data.get('professor') or self.request.data.get('profesor')
        extra_school = self.request.data.get('school') or self.request.data.get('escuela')
        extra_level = self.request.data.get('level') or self.request.data.get('nivel')
        updated_fields = []
        if extra_prof is not None:
            curso.profesor = str(extra_prof)
            updated_fields.append('profesor')
        if extra_school is not None:
            curso.escuela = str(extra_school)
            updated_fields.append('escuela')
        if extra_level is not None:
            curso.nivel = str(extra_level).upper()
            updated_fields.append('nivel')
        if updated_fields:
            curso.save(update_fields=updated_fields)
        _replace_course_modules(curso, self.request.data.get('temario') or self.request.data.get('modules'))

    def perform_update(self, serializer):
        if self.request.user.rol != 'ADMINISTRADOR' and serializer.instance.autor != self.request.user:
             raise PermissionDenied('No tienes permiso para editar este recurso')
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.rol != 'ADMINISTRADOR' and instance.autor != self.request.user:
             raise PermissionDenied('No tienes permiso para eliminar este recurso')
        instance.delete()
    
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
        
        url = recurso.archivo_url
        if getattr(recurso, 'archivo', None):
            try:
                url = request.build_absolute_uri(recurso.archivo.url)
            except Exception:
                url = recurso.archivo_url

        return Response({
            'message': 'Descarga registrada',
            'total_descargas': recurso.descargas,
            'url': url
        })
    
    @action(detail=True, methods=['post'])
    def calificar(self, request, pk=None):
        """Calificar un recurso"""
        recurso = self.get_object()
        calificacion_valor = request.data.get('calificacion')
        comentario = request.data.get('comentario', '')
        
        if not calificacion_valor or calificacion_valor not in [1, 2, 3, 4, 5]:
            return Response(
                {'error': 'CalificaciÃƒÆ’Ã‚Â³n debe ser entre 1 y 5'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear o actualizar calificaciÃƒÆ’Ã‚Â³n
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
            'message': 'CalificaciÃƒÆ’Ã‚Â³n registrada' if created else 'CalificaciÃƒÆ’Ã‚Â³n actualizada',
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
        
        # Ordenar por calificaciÃƒÆ’Ã‚Â³n
        recursos = recursos.order_by('-calificacion_promedio', '-descargas')
        
        serializer = self.get_serializer(recursos, many=True)
        return Response(serializer.data)


# ========== Formularios de Estudio (PDF) ==========

class FormularioEstudioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para formularios PDF de estudio
    """
    queryset = FormularioEstudio.objects.filter(activo=True)
    serializer_class = FormularioEstudioSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _user_is_admin(self, user):
        """Permitir subida solo a administradores reales."""
        rol = getattr(user, 'rol', '') or ''
        return (
            rol.upper() == 'ADMINISTRADOR'
            or getattr(user, 'is_staff', False)
            or getattr(user, 'is_superuser', False)
            or hasattr(user, 'perfil_administrador')
        )

    def perform_create(self, serializer):
        if self.request.user.rol != 'ADMINISTRADOR':
            raise PermissionDenied('Solo administradores pueden crear cursos')
        if hasattr(self.request.user, 'perfil_creador'):
            curso = serializer.save(creador=self.request.user.perfil_creador)
        else:
            first_creator = Creador.objects.first()
            if first_creator:
                curso = serializer.save(creador=first_creator)
            else:
                raise PermissionDenied('No hay perfil de Creador disponible para asignar al curso.')
        extra_prof = self.request.data.get('professor') or self.request.data.get('profesor')
        extra_school = self.request.data.get('school') or self.request.data.get('escuela')
        extra_level = self.request.data.get('level') or self.request.data.get('nivel')
        updated_fields = []
        if extra_prof is not None:
            curso.profesor = str(extra_prof)
            updated_fields.append('profesor')
        if extra_school is not None:
            curso.escuela = str(extra_school)
            updated_fields.append('escuela')
        if extra_level is not None:
            curso.nivel = str(extra_level).upper()
            updated_fields.append('nivel')
        if updated_fields:
            curso.save(update_fields=updated_fields)
        _replace_course_modules(curso, self.request.data.get('temario') or self.request.data.get('modules'))

    def perform_update(self, serializer):
        if not self._user_is_admin(self.request.user):
            raise PermissionDenied('Solo administradores pueden actualizar formularios.')
        serializer.save()

    def perform_destroy(self, instance):
        if not self._user_is_admin(self.request.user):
            raise PermissionDenied('Solo administradores pueden eliminar formularios.')
        return super().perform_destroy(instance)


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
        
        # Verificar si ya respondiÃƒÆ’Ã‚Â³ (si no es anÃƒÆ’Ã‚Â³nimo)
        if not formulario.anonimo:
            if RespuestaFormulario.objects.filter(
                formulario=formulario,
                usuario=request.user
            ).exists():
                return Response(
                    {'error': 'Ya has respondido este formulario'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Validar que el formulario estÃƒÆ’Ã‚Â© activo
        if formulario.fecha_cierre and timezone.now() > formulario.fecha_cierre:
            return Response(
                {'error': 'Este formulario ya estÃƒÆ’Ã‚Â¡ cerrado'},
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
        
        # EstadÃƒÆ’Ã‚Â­sticas por pregunta
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
                    'distribuciÃƒÆ’Ã‚Â³n': dict(opciones_count)
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
        
        # Excluir los que ya respondiÃƒÆ’Ã‚Â³ (si no son anÃƒÆ’Ã‚Â³nimos)
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
