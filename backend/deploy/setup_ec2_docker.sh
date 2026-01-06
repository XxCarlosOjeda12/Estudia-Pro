#!/bin/bash
# ============================================================
# Script de configuración EC2 con Docker para Estudia Pro
# Ubuntu Server 22.04 LTS
# ============================================================

set -e

echo "=========================================="
echo "  Estudia Pro - Setup EC2 con Docker"
echo "=========================================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }

# 1. Actualizar sistema
echo ""
echo ">>> Actualizando sistema..."
sudo apt-get update
sudo apt-get upgrade -y
print_status "Sistema actualizado"

# 2. Instalar Docker
echo ""
echo ">>> Instalando Docker..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Agregar clave GPG oficial de Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Agregar repositorio de Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
print_status "Docker instalado"

# 3. Configurar Docker para usuario ubuntu
echo ""
echo ">>> Configurando permisos de Docker..."
sudo usermod -aG docker ubuntu
print_status "Usuario ubuntu agregado al grupo docker"

# 4. Iniciar Docker
sudo systemctl enable docker
sudo systemctl start docker
print_status "Docker iniciado"

# 5. Crear estructura de directorios
echo ""
echo ">>> Creando directorios..."
mkdir -p /home/ubuntu/estudia-pro/backend
mkdir -p /home/ubuntu/estudia-pro/logs
print_status "Directorios creados"

# 6. Verificar instalación
echo ""
echo "=========================================="
echo "  Verificación de instalación"
echo "=========================================="
docker --version
docker compose version

echo ""
echo "=========================================="
echo -e "  ${GREEN}¡Configuración completada!${NC}"
echo "=========================================="
echo ""
echo "PRÓXIMOS PASOS:"
echo "1. Cerrar sesión y volver a conectar (para aplicar grupo docker)"
echo "   exit"
echo "   ssh -i tu-clave.pem ubuntu@tu-ip"
echo ""
echo "2. Subir el código del backend a /home/ubuntu/estudia-pro/backend"
echo ""
echo "3. Configurar el archivo .env:"
echo "   cd /home/ubuntu/estudia-pro/backend"
echo "   cp .env.production .env"
echo "   nano .env"
echo ""
echo "4. Iniciar con Docker Compose:"
echo "   docker compose up -d --build"
echo ""
echo "5. Ver logs:"
echo "   docker compose logs -f"
echo ""
