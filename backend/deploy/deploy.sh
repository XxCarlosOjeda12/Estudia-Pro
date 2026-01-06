#!/bin/bash
# ============================================================
# Script de despliegue para actualizaciones
# Ejecutar cada vez que se actualice el código
# ============================================================

set -e

echo "=========================================="
echo "  Estudia Pro - Despliegue"
echo "=========================================="

cd /home/ubuntu/estudia-pro

# Activar entorno virtual
source venv/bin/activate

# Ir al directorio backend
cd backend

# Instalar nuevas dependencias si las hay
echo ">>> Instalando dependencias..."
pip install -r requirements.txt

# Ejecutar migraciones
echo ">>> Ejecutando migraciones..."
python manage.py migrate --noinput

# Recolectar archivos estáticos
echo ">>> Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

# Reiniciar Gunicorn
echo ">>> Reiniciando servicio..."
sudo systemctl restart estudiapro

# Verificar estado
echo ">>> Verificando estado..."
sleep 2
sudo systemctl status estudiapro --no-pager | head -10

echo ""
echo "=========================================="
echo "  ¡Despliegue completado!"
echo "=========================================="
