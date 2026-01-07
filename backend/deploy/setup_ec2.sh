#!/bin/bash
# ============================================================
# Script de configuración inicial para EC2 Ubuntu 22.04
# Estudia Pro Backend
# ============================================================

set -e  

echo "=========================================="
echo "  Estudia Pro - Configuración EC2"
echo "=========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

echo ""
echo ">>> Actualizando sistema..."
sudo apt update && sudo apt upgrade -y
print_status "Sistema actualizado"

echo ""
echo ">>> Instalando dependencias del sistema..."
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    nginx \
    git \
    curl \
    sqlite3 \
    build-essential \
    libpq-dev
print_status "Dependencias instaladas"

echo ""
echo ">>> Creando estructura de directorios..."
mkdir -p /home/ubuntu/estudia-pro/logs
mkdir -p /home/ubuntu/estudia-pro/backend/staticfiles
print_status "Directorios creados"

echo ""
echo ">>> Creando entorno virtual de Python..."
cd /home/ubuntu/estudia-pro
python3 -m venv venv
source venv/bin/activate
print_status "Entorno virtual creado"

echo ""
echo ">>> Instalando dependencias de Python..."
cd /home/ubuntu/estudia-pro/backend
pip install --upgrade pip
pip install -r requirements.txt
print_status "Dependencias de Python instaladas"

if [ ! -f /home/ubuntu/estudia-pro/backend/.env ]; then
    echo ""
    echo ">>> Creando archivo .env..."
    cp /home/ubuntu/estudia-pro/backend/.env.production /home/ubuntu/estudia-pro/backend/.env
    print_warning "Archivo .env creado. EDITAR CON TUS VALORES REALES:"
    print_warning "  nano /home/ubuntu/estudia-pro/backend/.env"
fi

echo ""
echo ">>> Recolectando archivos estáticos..."
cd /home/ubuntu/estudia-pro/backend
source /home/ubuntu/estudia-pro/venv/bin/activate
python manage.py collectstatic --noinput
print_status "Archivos estáticos recolectados"

echo ""
echo ">>> Ejecutando migraciones de base de datos..."
python manage.py migrate --noinput
print_status "Migraciones ejecutadas"

echo ""
echo ">>> Configurando Nginx..."
sudo cp /home/ubuntu/estudia-pro/backend/deploy/nginx.conf /etc/nginx/sites-available/estudiapro
sudo ln -sf /etc/nginx/sites-available/estudiapro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
print_status "Nginx configurado"

echo ""
echo ">>> Configurando servicio Gunicorn..."
sudo cp /home/ubuntu/estudia-pro/backend/deploy/estudiapro.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable estudiapro
sudo systemctl start estudiapro
print_status "Servicio Gunicorn configurado"

echo ""
echo ">>> Configurando permisos..."
sudo chown -R ubuntu:ubuntu /home/ubuntu/estudia-pro
chmod +x /home/ubuntu/estudia-pro/backend/deploy/*.sh
print_status "Permisos configurados"

echo ""
echo "=========================================="
echo "  Estado de los servicios"
echo "=========================================="
echo ""
echo "Nginx:"
sudo systemctl status nginx --no-pager | head -5
echo ""
echo "Gunicorn (Estudia Pro):"
sudo systemctl status estudiapro --no-pager | head -5

echo ""
echo "=========================================="
echo -e "  ${GREEN}¡Configuración completada!${NC}"
echo "=========================================="
echo ""
echo "Próximos pasos:"
echo "1. Editar /home/ubuntu/estudia-pro/backend/.env con tus valores"
echo "2. Si cambiaste .env, ejecutar: sudo systemctl restart estudiapro"
echo "3. Verificar logs: tail -f /home/ubuntu/estudia-pro/logs/*.log"
echo "4. Probar API: curl http://localhost/api/"
echo ""
