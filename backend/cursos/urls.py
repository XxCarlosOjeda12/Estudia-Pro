from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'cursos', views.CursoViewSet, basename='curso')
router.register(r'recursos', views.RecursoViewSet, basename='recurso')
router.register(r'preguntas', views.PreguntaViewSet, basename='pregunta')
router.register(r'examenes', views.ExamenViewSet, basename='examen')
router.register(r'foro', views.ForoViewSet, basename='foro')  # NUEVO

urlpatterns = [
    path('', include(router.urls)),
    
    # Endpoints para el panel/dashboard
    path('mi-panel/', views.mi_panel, name='mi-panel'),
    path('mis-cursos/', views.mis_cursos_inscritos, name='mis-cursos'),
    path('buscar-cursos/', views.buscar_cursos, name='buscar-cursos'),
    
    # Endpoints para Mi Progreso
    path('mi-progreso/', views.mi_progreso_detallado, name='mi-progreso-detallado'),
    path('mis-logros/', views.mis_logros, name='mis-logros'),
    
    # Endpoints para Foro
    path('foro/respuesta/<int:respuesta_id>/votar/', views.votar_respuesta, name='votar-respuesta'),
]