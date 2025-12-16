from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('profile/', views.user_profile, name='profile'),
    path('verificar-rol/', views.verificar_rol, name='verificar-rol'),
    path('usuarios/', views.listar_usuarios, name='listar-usuarios'),
]