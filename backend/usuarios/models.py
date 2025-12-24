from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    ROLES = [
        ('ESTUDIANTE', 'Estudiante'),
        ('CREADOR', 'Creador'),
        ('ADMINISTRADOR', 'Administrador'),
    ]
    
    ESTADOS = [
        ('ACTIVO', 'Activo'),
        ('INACTIVO', 'Inactivo'),
        ('SUSPENDIDO', 'Suspendido'),
    ]
    
    email = models.EmailField(unique=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    rol = models.CharField(max_length=20, choices=ROLES)
    puntos_gamificacion = models.IntegerField(default=0)
    nivel = models.IntegerField(default=1)
    foto_perfil_url = models.URLField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='ACTIVO')
    is_premium = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'usuario'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
    
    def __str__(self):
        return f"{self.username} - {self.get_rol_display()}"


class Estudiante(models.Model):
    id_estudiante = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(
        Usuario, 
        on_delete=models.CASCADE, 
        related_name='perfil_estudiante'
    )
    nivel_escolar = models.CharField(max_length=100)
    id_institucion = models.IntegerField(null=True, blank=True)
    tiempo_estudio_minutos = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'estudiante'
        verbose_name = 'Estudiante'
        verbose_name_plural = 'Estudiantes'
    
    def __str__(self):
        return f"Estudiante: {self.id_usuario.username}"


class Creador(models.Model):
    id_creador = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(
        Usuario, 
        on_delete=models.CASCADE, 
        related_name='perfil_creador'
    )
    especialidad = models.CharField(max_length=200)
    calificacion_promedio = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0.00
    )
    ranking_promedio = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0.00
    )
    num_resenas = models.IntegerField(default=0)
    biografia = models.TextField(blank=True, default='')
    tarifa_30_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tarifa_60_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'creador'
        verbose_name = 'Creador'
        verbose_name_plural = 'Creadores'
    
    def __str__(self):
        return f"Creador: {self.id_usuario.username}"


class Administrador(models.Model):
    id_administrador = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(
        Usuario, 
        on_delete=models.CASCADE, 
        related_name='perfil_administrador'
    )
    permiso = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'administrador'
        verbose_name = 'Administrador'
        verbose_name_plural = 'Administradores'
    
    def __str__(self):
        return f"Admin: {self.id_usuario.username}"