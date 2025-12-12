from django.contrib import admin
from .models import Usuario, Estudiante, Creador, Administrador


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'email', 'rol', 'estado', 'nivel', 'puntos_gamificacion', 'fecha_registro']
    list_filter = ['rol', 'estado']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-fecha_registro']


@admin.register(Estudiante)
class EstudianteAdmin(admin.ModelAdmin):
    list_display = ['id_estudiante', 'get_username', 'nivel_escolar', 'id_institucion']
    search_fields = ['id_usuario__username', 'id_usuario__email']
    
    def get_username(self, obj):
        return obj.id_usuario.username
    get_username.short_description = 'Usuario'


@admin.register(Creador)
class CreadorAdmin(admin.ModelAdmin):
    list_display = ['id_creador', 'get_username', 'especialidad', 'calificacion_promedio', 'num_resenas']
    search_fields = ['id_usuario__username', 'especialidad']
    
    def get_username(self, obj):
        return obj.id_usuario.username
    get_username.short_description = 'Usuario'


@admin.register(Administrador)
class AdministradorAdmin(admin.ModelAdmin):
    list_display = ['id_administrador', 'get_username', 'permiso']
    search_fields = ['id_usuario__username']
    
    def get_username(self, obj):
        return obj.id_usuario.username
    get_username.short_description = 'Usuario'