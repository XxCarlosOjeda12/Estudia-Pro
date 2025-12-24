from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('profile/', views.user_profile, name='profile'),
    path('verificar-rol/', views.verificar_rol, name='verificar-rol'),
    path('activate-premium/', views.activate_premium, name='activate-premium'),
    path('track-time/', views.track_time, name='track-time'),
    path('admin/users/', views.manage_users, name='manage-users'),
    path('admin/users/<int:pk>/', views.manage_user_detail, name='manage-user-detail'),
]