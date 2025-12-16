from django.db import migrations


def activate_approved_community_resources(apps, schema_editor):
    RecursoComunidad = apps.get_model('cursos', 'RecursoComunidad')
    RecursoComunidad.objects.filter(aprobado=True, activo=False).update(activo=True)


class Migration(migrations.Migration):
    dependencies = [
        ('cursos', '0008_recursocomunidad_archivo_formularioestudio'),
    ]

    operations = [
        migrations.RunPython(activate_approved_community_resources, migrations.RunPython.noop),
    ]

