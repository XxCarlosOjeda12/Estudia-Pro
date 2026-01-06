from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cursos', '0009_fix_recursocomunidad_activo'),
    ]

    operations = [
        migrations.AddField(
            model_name='curso',
            name='escuela',
            field=models.CharField(blank=True, default='ESCOM', max_length=120),
        ),
        migrations.AddField(
            model_name='curso',
            name='profesor',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
    ]

