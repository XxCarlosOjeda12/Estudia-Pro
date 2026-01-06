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

# Detener contenedores actuales (si existen)
echo ">>> Deteniendo contenedores..."
docker compose down || true

# Construir y levantar
echo ">>> Construyendo y levantando servicios..."
docker compose up -d --build

# Esperar a que el backend esté listo
echo ">>> Esperando a que el backend inicie..."
sleep 10

# Ejecutar migraciones dentro del contenedor
echo ">>> Ejecutando migraciones..."
docker compose exec -T backend python manage.py migrate --noinput

# Verificar estado
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
