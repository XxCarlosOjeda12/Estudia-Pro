from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Usuario


def _is_admin(user: Usuario) -> bool:
    try:
        return user.rol == 'ADMINISTRADOR' or hasattr(user, 'perfil_administrador')
    except Exception:
        return False


def _serialize_user(user: Usuario) -> dict:
    full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
    return {
        'id': user.id,
        'name': full_name or user.username,
        'email': user.email,
        'role': user.rol,
        'verified': bool(user.is_active and user.estado == 'ACTIVO'),
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    if not _is_admin(request.user):
        return Response({'error': 'Solo administradores.'}, status=status.HTTP_403_FORBIDDEN)

    users = Usuario.objects.all().order_by('-id')
    return Response([_serialize_user(user) for user in users])


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def admin_users_manage(request, user_id: int):
    if not _is_admin(request.user):
        return Response({'error': 'Solo administradores.'}, status=status.HTTP_403_FORBIDDEN)

    action = (request.data.get('action') or '').lower().strip()
    target = Usuario.objects.filter(id=user_id).first()
    if not target:
        return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if action == 'delete':
        if target.id == request.user.id:
            return Response({'error': 'No puedes eliminar tu propia cuenta.'}, status=status.HTTP_400_BAD_REQUEST)
        target.delete()
        return Response({'success': True})

    # Soporte mínimo para editar campos comunes si se requiere en frontend
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
    target.save()

    return Response({'success': True, 'user': _serialize_user(target)})

