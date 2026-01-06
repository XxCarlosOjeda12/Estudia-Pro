from django.urls import path, re_path

from . import admin_views


urlpatterns = [
    path('users/', admin_views.admin_users_list, name='admin-users-list'),
    re_path(r'^users/(?P<user_id>\d+)/?$', admin_views.admin_users_manage, name='admin-users-manage'),
    path('custom/cursos/', admin_views.admin_courses_create, name='admin-courses-create'),
    path('custom/cursos/<int:course_id>', admin_views.admin_courses_manage, name='admin-courses-manage'),
]

