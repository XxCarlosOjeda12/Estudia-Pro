from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .serializers import RegisterSerializer, LoginSerializer, UsuarioSerializer
from .models import Usuario

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
            'token': token.key,
            'usuario': UsuarioSerializer(usuario).data,
            'message': 'Usuario creado exitosamente'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
            'token': token.key,
            'usuario': UsuarioSerializer(usuario).data,
            'message': 'Login exitoso'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data)

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
        return Response({
            'message': 'Sesión cerrada exitosamente'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
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
        'puntos': usuario.puntos_gamificacion
    })