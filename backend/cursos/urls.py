from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'cursos', views.CursoViewSet, basename='curso')
router.register(r'recursos', views.RecursoViewSet, basename='recurso')
router.register(r'preguntas', views.PreguntaViewSet, basename='pregunta')
router.register(r'examenes', views.ExamenViewSet, basename='examen')
router.register(r'foro', views.ForoViewSet, basename='foro')
router.register(r'recursos-comunidad', views.RecursoComunidadViewSet, basename='recurso-comunidad') 
router.register(r'formularios', views.FormularioViewSet, basename='formulario')  
router.register(r'formularios-estudio', views.FormularioEstudioViewSet, basename='formulario-estudio')
router.register(r'proximas-actividades', views.ProximaActividadViewSet, basename='proxima-actividad')
router.register(r'tutores', views.TutorViewSet, basename='tutor')
router.register(r'notificaciones', views.NotificacionViewSet, basename='notificacion')

urlpatterns = [
    path('', include(router.urls)),
    
    # Endpoints para el panel/dashboard
    path('mi-panel/', views.mi_panel, name='mi-panel'),
    path('mis-cursos/', views.mis_cursos_inscritos, name='mis-cursos'),
    path('mis-cursos/fecha-examen/', views.actualizar_fecha_examen, name='actualizar-fecha-examen'),
    path('buscar-cursos/', views.buscar_cursos, name='buscar-cursos'),
    
    # Endpoints para Mi Progreso
    path('mi-progreso/', views.mi_progreso_detallado, name='mi-progreso-detallado'),
    path('mis-logros/', views.mis_logros, name='mis-logros'),
    
    # Endpoints para Foro
    path('foro/respuesta/<int:respuesta_id>/votar/', views.votar_respuesta, name='votar-respuesta'),
]
