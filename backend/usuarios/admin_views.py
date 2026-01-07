import json
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Usuario, Creador
from cursos.models import Curso, Modulo


def _is_admin(user: Usuario) -> bool:
    try:
        return user.rol == 'ADMINISTRADOR' or hasattr(user, 'perfil_administrador')
    except Exception:
        return False


def _to_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return value != 0
    value_str = str(value).strip().lower()
    return value_str in ('true', '1', 'yes', 'on', 'activo', 'active')


def _serialize_user(user: Usuario) -> dict:
    full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
    premium_flag = bool(getattr(user, 'is_premium', False))
    return {
        'id': user.id,
        'name': full_name or user.username,
        'email': user.email,
        'role': user.rol,
        'verified': bool(user.is_active and user.estado == 'ACTIVO'),
        'is_premium': premium_flag,
        'premium': premium_flag,
    }


def _serialize_course(curso: Curso) -> dict:
    creador_user = getattr(getattr(curso, 'creador', None), 'id_usuario', None)
    professor = (curso.profesor or '').strip()
    if not professor and creador_user:
        professor = f"{creador_user.first_name} {creador_user.last_name}".strip() or creador_user.username
    temario = [
        {'title': modulo.titulo, 'description': modulo.descripcion}
        for modulo in curso.modulos.all().order_by('orden')
    ]

    return {
        'id': curso.id,
        'title': curso.titulo,
        'description': curso.descripcion,
        'professor': professor or 'Profesor',
        'school': curso.escuela or 'ESCOM',
        'level': curso.get_nivel_display() if hasattr(curso, 'get_nivel_display') else curso.nivel,
        'temario': temario,
        'category': getattr(curso, 'categoria', None),
    }


def _parse_temario_payload(raw):
    if raw is None:
        return []
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            raw = [item.strip() for item in raw.split('\n') if item.strip()]
    if not isinstance(raw, (list, tuple)):
        return []
    parsed = []
    for idx, item in enumerate(raw):
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


def _replace_modules(curso: Curso, temario):
    modules = _parse_temario_payload(temario)
    if modules is None:
        return
    curso.modulos.all().delete()
    for item in modules:
        Modulo.objects.create(
            curso=curso,
            titulo=item['title'],
            descripcion=item.get('description', ''),
            orden=item.get('order', 0)
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    if not _is_admin(request.user):
        return Response({'error': 'Solo administradores.'}, status=status.HTTP_403_FORBIDDEN)

    users = Usuario.objects.all().order_by('-id')
    return Response([_serialize_user(user) for user in users])


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_users_manage(request, user_id: int):
    if not _is_admin(request.user):
        return Response({'error': 'Solo administradores.'}, status=status.HTTP_403_FORBIDDEN)

    action = (request.data.get('action') or '').lower().strip()
    target = Usuario.objects.filter(id=user_id).first()
    if not target:
        return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE' or action == 'delete':
        if target.id == request.user.id:
            return Response({'error': 'No puedes eliminar tu propia cuenta.'}, status=status.HTTP_400_BAD_REQUEST)
        target.delete()
        return Response({'success': True})

    role = request.data.get('role') or request.data.get('rol')
    if role:
        target.rol = str(role).upper()
    estado = request.data.get('estado')
    if estado:
        target.estado = str(estado).upper()
    if 'email' in request.data:
        target.email = str(request.data.get('email') or '').lower()
    if 'first_name' in request.data:
        target.first_name = str(request.data.get('first_name') or '')
    if 'last_name' in request.data:
        target.last_name = str(request.data.get('last_name') or '')
    if 'name' in request.data:
        name = str(request.data.get('name') or '').strip()
        if name:
            parts = name.split(' ', 1)
            target.first_name = parts[0]
            target.last_name = parts[1] if len(parts) > 1 else ''
    if 'verified' in request.data:
        verified = _to_bool(request.data.get('verified'))
        target.is_active = verified
        target.estado = 'ACTIVO' if verified else 'INACTIVO'
    if 'is_premium' in request.data:
        target.is_premium = _to_bool(request.data.get('is_premium'))
    target.save()

    return Response({'success': True, 'user': _serialize_user(target)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_courses_create(request):
    if not _is_admin(request.user):
        return Response({'error': 'Solo administradores.'}, status=status.HTTP_403_FORBIDDEN)

    title = request.data.get('title') or request.data.get('titulo')
    description = request.data.get('description') or request.data.get('descripcion') or ''
    nivel = (request.data.get('level') or request.data.get('nivel') or 'BASICO').upper()
    categoria = (request.data.get('categoria') or 'MATEMATICAS').upper()
    profesor = request.data.get('professor') or request.data.get('profesor') or ''
    escuela = request.data.get('school') or request.data.get('escuela') or ''
    temario = request.data.get('temario') or request.data.get('modules')

    if not title:
        return Response({'error': 'title es requerido'}, status=status.HTTP_400_BAD_REQUEST)

    creador = Creador.objects.first()
    if not creador:
        return Response({'error': 'No hay creadores disponibles para asignar.'}, status=status.HTTP_400_BAD_REQUEST)

    curso = Curso.objects.create(
        titulo=title,
        descripcion=description,
        profesor=profesor,
        escuela=escuela,
        categoria=categoria,
        nivel=nivel,
        creador=creador
    )
    _replace_modules(curso, temario)
    payload = _serialize_course(curso)
    return Response({'success': True, 'course': payload, 'subject': payload}, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_courses_manage(request, course_id: int):
    if not _is_admin(request.user):
        return Response({'error': 'Solo administradores.'}, status=status.HTTP_403_FORBIDDEN)

    curso = Curso.objects.filter(id=course_id).first()
    if not curso:
        return Response({'error': 'Curso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        curso.delete()
        return Response({'success': True})

    # PUT
    if 'title' in request.data or 'titulo' in request.data:
        curso.titulo = request.data.get('title') or request.data.get('titulo')
    if 'description' in request.data or 'descripcion' in request.data:
        curso.descripcion = request.data.get('description') or request.data.get('descripcion') or ''
    if 'professor' in request.data or 'profesor' in request.data:
        curso.profesor = request.data.get('professor') or request.data.get('profesor') or ''
    if 'school' in request.data or 'escuela' in request.data:
        curso.escuela = request.data.get('school') or request.data.get('escuela') or ''
    if 'level' in request.data or 'nivel' in request.data:
        curso.nivel = str(request.data.get('level') or request.data.get('nivel')).upper()
    if 'categoria' in request.data:
        curso.categoria = str(request.data.get('categoria')).upper()
    curso.save()
    if 'temario' in request.data or 'modules' in request.data:
        _replace_modules(curso, request.data.get('temario') or request.data.get('modules'))
    payload = _serialize_course(curso)
    return Response({'success': True, 'course': payload, 'subject': payload})

