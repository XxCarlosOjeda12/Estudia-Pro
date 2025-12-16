from django.urls import path

from . import admin_views


urlpatterns = [
    path('users/', admin_views.admin_users_list, name='admin-users-list'),
    path('users/<int:user_id>', admin_views.admin_users_manage, name='admin-users-manage'),
]

