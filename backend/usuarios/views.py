from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .serializers import RegisterSerializer, LoginSerializer, UsuarioSerializer
from .models import Usuario

def build_user_payload(usuario: Usuario) -> dict:
    """Normaliza la respuesta de usuario al formato esperado por el frontend."""
    serializer = UsuarioSerializer(usuario)
    data = serializer.data
    return {
        'id': data.get('id'),
        'username': data.get('username'),
        'email': data.get('email'),
        'first_name': data.get('first_name'),
        'last_name': data.get('last_name'),
        'rol': data.get('rol'),
        'foto_perfil_url': data.get('foto_perfil_url'),
        'nivel': data.get('nivel'),
        'puntos_gamificacion': data.get('puntos_gamificacion'),
        'streak': data.get('streak', 0),
        'is_premium': data.get('is_premium', False),
    }

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    """
    Función: register
    Descripción: Registra un nuevo usuario en el sistema y crea su perfil según el rol asignado.
    Input:
      - request: Objeto Request de Django REST Framework con los datos del usuario
    Output:
      - Response: Token de autenticación y datos del usuario creado (201) o errores de validación (400)
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        usuario = serializer.save()
        token, created = Token.objects.get_or_create(user=usuario)
        
        return Response({
            'success': True,
            'message': 'Registro exitoso',
            'token': token.key,
            'user': build_user_payload(usuario)
        }, status=status.HTTP_201_CREATED)
    
    return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    """
    Función: login
    Descripción: Autentica un usuario y genera un token de acceso.
    Input:
      - request: Objeto Request con username y password
    Output:
      - Response: Token de autenticación y datos del usuario (200) o errores de validación (400)
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        usuario = serializer.validated_data
        token, created = Token.objects.get_or_create(user=usuario)
        
        return Response({
            'success': True,
            'token': token.key,
            'user': build_user_payload(usuario)
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': 'Credenciales inválidas'
    }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    """
    Función: user_profile
    Descripción: Obtiene los datos completos del perfil del usuario autenticado.
    Input:
      - request: Objeto Request con usuario autenticado
    Output:
      - Response: Datos del usuario incluyendo perfil según su rol (200)
    """
    return Response(build_user_payload(request.user))

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout(request):
    """
    Función: logout
    Descripción: Cierra la sesión del usuario eliminando su token de autenticación.
    Input:
      - request: Objeto Request con usuario autenticado
    Output:
      - Response: Mensaje de confirmación (200) o error interno (500)
    """
    try:
        request.user.auth_token.delete()
        return Response({'success': True}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def verificar_rol(request):
    """
    Función: verificar_rol
    Descripción: Verifica y retorna el rol del usuario autenticado junto con información adicional.
    Input:
      - request: Objeto Request con usuario autenticado
    Output:
      - Response: Información del rol, estado, nivel y puntos del usuario (200)
    """
    usuario = request.user
    
    return Response({
        'username': usuario.username,
        'rol': usuario.rol,
        'is_estudiante': usuario.rol == 'ESTUDIANTE',
        'is_creador': usuario.rol == 'CREADOR',
        'is_administrador': usuario.rol == 'ADMINISTRADOR',
        'estado': usuario.estado,
        'nivel': usuario.nivel,
        'puntos': usuario.puntos_gamificacion,
        'is_premium': getattr(usuario, 'is_premium', False)
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def activate_premium(request):
    """
    Función: activate_premium
    Descripción: Activa el estado premium para el usuario autenticado (simulado).
    Input:
      - request: Objeto Request con usuario autenticado
    Output:
      - Response: Mensaje de éxito y nuevo estado (200)
    """
    usuario = request.user
    usuario.is_premium = True
    usuario.save()
    
    return Response({
        'success': True,
        'is_premium': True,
        'user': build_user_payload(usuario)
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def track_time(request):
    """
    Función: track_time
    Descripción: Incrementa el tiempo de estudio del estudiante.
    Input: { "minutes": int }
    """
    minutes = request.data.get('minutes', 1)
    try:
        minutes = int(minutes)
    except (ValueError, TypeError):
        minutes = 1
        
    usuario = request.user
    total = 0
    if usuario.rol == 'ESTUDIANTE' and hasattr(usuario, 'perfil_estudiante'):
        estudiante = usuario.perfil_estudiante
        estudiante.tiempo_estudio_minutos += max(minutes, 0)
        estudiante.save(update_fields=['tiempo_estudio_minutos'])
        total = estudiante.tiempo_estudio_minutos
    return Response({'success': True, 'total_minutes': total}, status=status.HTTP_200_OK)
    

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def manage_users(request):
    """
    Función: manage_users
    Descripción: Lista todos los usuarios (solo admin).
    """
    if request.user.rol != 'ADMINISTRADOR':
        return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
    
    usuarios = Usuario.objects.all().order_by('-fecha_registro')
    serializer = UsuarioSerializer(usuarios, many=True)
    return Response(serializer.data)

@api_view(['PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def manage_user_detail(request, pk):
    """
    Función: manage_user_detail
    Descripción: Actualiza o elimina un usuario específico (solo admin).
    """
    if request.user.rol != 'ADMINISTRADOR':
        return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        usuario = Usuario.objects.get(pk=pk)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        usuario.delete()
        return Response({'message': 'Usuario eliminado'}, status=status.HTTP_204_NO_CONTENT)

    if request.method == 'PUT':
        data = request.data
        
        # Update basic fields
        if 'name' in data:
            # Assuming name is stored in first_name/last_name or just handled differently,
            # but since Usuario is AbstractUser it has first_name, last_name unless overridden.
            # Frontend sends "name". Let's try to split or just ignore if not easy mapping.
            # Ideally the serializer handles updates.
            pass
            
        if 'is_premium' in data:
            usuario.is_premium = bool(data['is_premium'])
            
        if 'verified' in data:
            # Assuming 'verified' maps to something, or maybe extended profile.
            # For now, if model doesn't have verified, skip.
            # Wait, api.js sends verified.
            pass

        # Use serializer for standard fields if possible, or manual update for custom ones
        # Simple manual update for now as per requirement
        if 'name' in data:
            usuario.first_name = data['name'] # Simplification
        if 'email' in data:
            usuario.email = data['email']
        if 'role' in data:
            usuario.rol = data['role'].upper()
            
        usuario.save()
        return Response(UsuarioSerializer(usuario).data)
