from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'cursos', views.CursoViewSet, basename='curso')
router.register(r'recursos', views.RecursoViewSet, basename='recurso')
router.register(r'preguntas', views.PreguntaViewSet, basename='pregunta')
router.register(r'examenes', views.ExamenViewSet, basename='examen')

urlpatterns = [
    path('', include(router.urls)),
]