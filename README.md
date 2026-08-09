# RedTeam Forge

Plataforma avanzada de Ethical Hacking y desarrollo de Malware, impulsada por IA (Claude Code) y diseñada para entornos de pruebas autorizados.

## Características

- **Gestión de Engagements**: Control de clientes y proyectos para mantener el alcance (scope) autorizado.
- **Generación de Artefactos**: Creación de malware, exploits y herramientas en múltiples lenguajes usando Claude Code.
- **Compilación Automática**: Compilación y ejecución de los artefactos generados directamente desde la interfaz.
- **Base de Conocimiento RAG**: Sistema de preguntas y respuestas basado en literatura técnica de ciberseguridad.
- **Reportes Automáticos**: Generación de informes de vulnerabilidades y remediación.

## Arquitectura

- **Frontend**: React.js, TailwindCSS (Bilingüe ES/EN)
- **Backend**: FastAPI (Python)
- **IA**: Claude Code CLI (Anthropic API)
- **Base de Datos**: SQLite (Local)
- **Almacenamiento**: Local (VM) y sincronización con GitHub (rama cifrada)

## Instalación

1. Clonar el repositorio.
2. Ejecutar el script de instalación `install.sh`.
3. Iniciar el servidor con `start.sh`.
