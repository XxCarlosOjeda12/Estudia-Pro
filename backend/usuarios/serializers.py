from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Usuario, Estudiante, Creador, Administrador

class EstudianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estudiante
        fields = ['nivel_escolar', 'id_institucion', 'tiempo_estudio_minutos']

class CreadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Creador
        fields = ['especialidad', 'calificacion_promedio', 'ranking_promedio', 'num_resenas',
                  'biografia', 'tarifa_30_min', 'tarifa_60_min', 'activo']

class AdministradorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Administrador
        fields = ['permiso']

class UsuarioSerializer(serializers.ModelSerializer):
    perfil_estudiante = EstudianteSerializer(read_only=True)
    perfil_creador = CreadorSerializer(read_only=True)
    perfil_administrador = AdministradorSerializer(read_only=True)
    streak = serializers.SerializerMethodField()
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'fecha_registro', 'rol', 'puntos_gamificacion', 'nivel', 
                  'foto_perfil_url', 'estado', 'is_premium', 'streak',
                  'perfil_estudiante', 'perfil_creador', 'perfil_administrador']
        read_only_fields = ['fecha_registro', 'puntos_gamificacion', 'nivel']

    def get_streak(self, obj):
        # Campo requerido por el frontend; si no existe en el modelo usamos 0 por defecto
        return getattr(obj, 'streak', 0) or 0

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
        
    def validate_email(self, value):
        """Validar que el email no esté registrado"""
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado")
        return value.lower()
    
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
        
        rol = (data.get('rol') or 'ESTUDIANTE').upper()
        data['rol'] = rol
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
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
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
        identifier = data.get('username') or data.get('email')
        password = data.get('password')

        # Permitir login tanto por username como por email
        user_obj = None
        if identifier:
            user_obj = Usuario.objects.filter(username__iexact=identifier).first()
            if not user_obj:
                user_obj = Usuario.objects.filter(email__iexact=identifier).first()

        if user_obj:
            usuario = authenticate(username=user_obj.username, password=password)
        else:
            usuario = authenticate(username=identifier, password=password)

        if usuario and usuario.is_active and usuario.estado == 'ACTIVO':
            return usuario
        raise serializers.ValidationError("Credenciales incorrectas o usuario inactivo")
