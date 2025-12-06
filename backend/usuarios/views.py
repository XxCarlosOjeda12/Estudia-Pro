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
    Registro de nuevos usuarios
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
    Login de usuarios
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
    Obtener perfil del usuario autenticado
    """
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout(request):
    """
    Logout - elimina el token
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
    Verifica el rol del usuario autenticado
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