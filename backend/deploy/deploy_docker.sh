#!/bin/bash
# ============================================================
# Script de despliegue con Docker para Estudia Pro
# Ejecutar desde /home/ubuntu/estudia-pro/backend
# ============================================================

set -e

echo "=========================================="
echo "  Estudia Pro - Deploy con Docker"
echo "=========================================="

cd /home/ubuntu/estudia-pro/backend

echo ">>> Deteniendo contenedores..."
docker compose down || true

echo ">>> Construyendo y levantando servicios..."
docker compose up -d --build

echo ">>> Esperando a que el backend inicie..."
sleep 10

echo ">>> Ejecutando migraciones..."
docker compose exec -T backend python manage.py migrate --noinput

echo ""
echo ">>> Estado de los contenedores:"
docker compose ps

echo ""
echo ">>> Logs recientes:"
docker compose logs --tail=20

echo ""
echo "=========================================="
echo "  ¡Despliegue completado!"
echo "=========================================="
echo ""
echo "Comandos útiles:"
echo "  docker compose logs -f          # Ver logs en tiempo real"
echo "  docker compose restart backend  # Reiniciar backend"
echo "  docker compose down             # Detener todo"
echo "  docker compose exec backend python manage.py shell  # Django shell"
echo ""
