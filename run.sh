#!/bin/bash
#
# RedTeam Forge - Lanzador
# Carga Node vía nvm (necesario para `npm start` del frontend) y arranca la
# plataforma llamando a start.sh. Úsalo tras reiniciar la VM: no reinstala nada.
#
set -e

# Directorio de este script (raíz del repo), para poder ejecutarlo desde cualquier sitio.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Cargar nvm y seleccionar la versión de Node por defecto.
export NVM_DIR="${NVM_DIR:-$HOME/.config/nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm use default >/dev/null 2>&1 || true
fi

# Comprobar que node/npm están disponibles antes de arrancar el frontend.
if ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] npm no encontrado. Instala Node (nvm install --lts) o revisa NVM_DIR." >&2
  exit 1
fi

echo "[*] Node: $(node --version) | npm: $(npm --version)"
echo "[*] Iniciando RedTeam Forge (backend :8000, frontend :3000)..."

# Delegar el arranque real en start.sh.
exec ./start.sh
