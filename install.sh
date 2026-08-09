#!/bin/bash

# RedTeam Forge - Script de Instalación
echo "=================================================="
echo "  RedTeam Forge - Instalación"
echo "=================================================="

# Comprobar root para dependencias del sistema
if [ "$EUID" -ne 0 ]; then
  echo "Instalando dependencias del sistema (requiere sudo)..."
  sudo apt-get update
  sudo apt-get install -y python3-pip python3-venv gcc g++ golang-go nasm poppler-utils
else
  apt-get update
  apt-get install -y python3-pip python3-venv gcc g++ golang-go nasm poppler-utils
fi

# Instalar dependencias del Backend
echo ""
echo "[*] Configurando el Backend (FastAPI)..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Instalar dependencias del Frontend
echo ""
echo "[*] Configurando el Frontend (React)..."
cd frontend
# Asegurar que npm instale tailwindcss y dependencias adicionales
npm install
npm install -D tailwindcss postcss autoprefixer @tailwindcss/typography
npx tailwindcss init -p
cd ..

# Crear archivo .env base
echo ""
echo "[*] Configurando variables de entorno..."
if [ ! -f backend/.env ]; then
  cat > backend/.env << EOL
# Configuración de RedTeam Forge
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-"pon_tu_api_key_aqui"}
CLAUDE_MODEL=claude-opus-4-5
CLAUDE_CODE_CMD=claude
SECRET_KEY=$(openssl rand -hex 32)
EOL
  echo "Archivo backend/.env creado. Por favor, asegúrate de que ANTHROPIC_API_KEY esté configurado."
fi

# Crear directorios necesarios
echo ""
echo "[*] Creando estructura de directorios..."
mkdir -p artifacts reports knowledge_base/raw_text knowledge_base/faiss_index

echo ""
echo "=================================================="
echo "  Instalación completada con éxito."
echo "=================================================="
echo "Para iniciar la plataforma, ejecuta: ./start.sh"
