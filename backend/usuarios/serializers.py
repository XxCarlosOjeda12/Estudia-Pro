from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Usuario, Estudiante, Creador, Administrador

class EstudianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estudiante
        fields = ['nivel_escolar', 'id_institucion']

class CreadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Creador
        fields = ['especialidad', 'calificacion_promedio', 'ranking_promedio', 'num_resenas']

class AdministradorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Administrador
        fields = ['permiso']

class UsuarioSerializer(serializers.ModelSerializer):
    perfil_estudiante = EstudianteSerializer(read_only=True)
    perfil_creador = CreadorSerializer(read_only=True)
    perfil_administrador = AdministradorSerializer(read_only=True)
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'fecha_registro', 'rol', 'puntos_gamificacion', 'nivel', 
                  'foto_perfil_url', 'estado', 'perfil_estudiante', 
                  'perfil_creador', 'perfil_administrador']
        read_only_fields = ['fecha_registro', 'puntos_gamificacion', 'nivel']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)
    
    # Campos opcionales según el rol
    nivel_escolar = serializers.CharField(required=False, allow_blank=True)
    id_institucion = serializers.IntegerField(required=False, allow_null=True)
    especialidad = serializers.CharField(required=False, allow_blank=True)
    permiso = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Usuario
        fields = ['username', 'email', 'password', 'password_confirm', 
                  'first_name', 'last_name', 'rol', 'foto_perfil_url',
                  'nivel_escolar', 'id_institucion', 'especialidad', 'permiso']
    
    def validate(self, data):
        """
        Función: validate
        Descripción: Valida que las contraseñas coincidan y que se proporcionen los campos requeridos según el rol.
        Input:
          - data: Diccionario con los datos del formulario de registro
        Output:
          - data: Datos validados o lanza ValidationError si hay errores
        """
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden"})
        
        rol = data.get('rol')
        if rol == 'ESTUDIANTE' and not data.get('nivel_escolar'):
            raise serializers.ValidationError({"nivel_escolar": "Este campo es requerido para estudiantes"})
        
        if rol == 'CREADOR' and not data.get('especialidad'):
            raise serializers.ValidationError({"especialidad": "Este campo es requerido para creadores"})
        
        if rol == 'ADMINISTRADOR' and not data.get('permiso'):
            raise serializers.ValidationError({"permiso": "Este campo es requerido para administradores"})
        
        return data
    
    def create(self, validated_data):
        """
        Función: create
        Descripción: Crea un nuevo usuario y su perfil correspondiente según el rol asignado.
        Input:
          - validated_data: Datos validados del usuario a crear
        Output:
          - usuario: Instancia del usuario creado con su perfil asociado
        """
        validated_data.pop('password_confirm')
        nivel_escolar = validated_data.pop('nivel_escolar', None)
        id_institucion = validated_data.pop('id_institucion', None)
        especialidad = validated_data.pop('especialidad', None)
        permiso = validated_data.pop('permiso', None)
        
        # Crear el usuario
        password = validated_data.pop('password')
        usuario = Usuario.objects.create(**validated_data)
        usuario.set_password(password)
        usuario.save()
        
        # Crear el perfil según el rol
        if usuario.rol == 'ESTUDIANTE':
            Estudiante.objects.create(
                id_usuario=usuario,
                nivel_escolar=nivel_escolar,
                id_institucion=id_institucion
            )
        elif usuario.rol == 'CREADOR':
            Creador.objects.create(
                id_usuario=usuario,
                especialidad=especialidad
            )
        elif usuario.rol == 'ADMINISTRADOR':
            Administrador.objects.create(
                id_usuario=usuario,
                permiso=permiso
            )
        
        return usuario

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        """
        Función: validate
        Descripción: Autentica las credenciales del usuario y verifica que esté activo.
        Input:
          - data: Diccionario con username y password
        Output:
          - usuario: Instancia del usuario autenticado o lanza ValidationError
        """
        usuario = authenticate(username=data['username'], password=data['password'])
        if usuario and usuario.is_active and usuario.estado == 'ACTIVO':
            return usuario
        raise serializers.ValidationError("Credenciales incorrectas o usuario inactivo")