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

source venv/bin/activate

cd backend

echo ">>> Instalando dependencias..."
pip install -r requirements.txt

echo ">>> Ejecutando migraciones..."
python manage.py migrate --noinput

echo ">>> Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo ">>> Reiniciando servicio..."
sudo systemctl restart estudiapro

echo ">>> Verificando estado..."
sleep 2
sudo systemctl status estudiapro --no-pager | head -10

echo ""
echo "=========================================="
echo "  ¡Despliegue completado!"
echo "=========================================="
