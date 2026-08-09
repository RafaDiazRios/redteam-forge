"""
Compiler Service - Compilación y ejecución de artefactos ofensivos multi-lenguaje.
Soporta: Python, C, C++, Go, Rust, PowerShell, Bash, JavaScript, PHP, Ruby, Java, C#
"""
import os
import asyncio
import tempfile
import shutil
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


LANGUAGE_CONFIG = {
    "python": {
        "extension": ".py",
        "compile": None,  # Interpretado
        "run": ["python3", "{file}"],
        "check_cmd": "python3 --version"
    },
    "c": {
        "extension": ".c",
        "compile": ["gcc", "-o", "{output}", "{file}", "-Wall", "-O2"],
        "run": ["{output}"],
        "check_cmd": "gcc --version"
    },
    "cpp": {
        "extension": ".cpp",
        "compile": ["g++", "-o", "{output}", "{file}", "-Wall", "-O2", "-std=c++17"],
        "run": ["{output}"],
        "check_cmd": "g++ --version"
    },
    "c++": {
        "extension": ".cpp",
        "compile": ["g++", "-o", "{output}", "{file}", "-Wall", "-O2", "-std=c++17"],
        "run": ["{output}"],
        "check_cmd": "g++ --version"
    },
    "go": {
        "extension": ".go",
        "compile": ["go", "build", "-o", "{output}", "{file}"],
        "run": ["{output}"],
        "check_cmd": "go version"
    },
    "rust": {
        "extension": ".rs",
        "compile": ["rustc", "-o", "{output}", "{file}"],
        "run": ["{output}"],
        "check_cmd": "rustc --version"
    },
    "bash": {
        "extension": ".sh",
        "compile": None,
        "run": ["bash", "{file}"],
        "check_cmd": "bash --version"
    },
    "powershell": {
        "extension": ".ps1",
        "compile": None,
        "run": ["pwsh", "-File", "{file}"],
        "check_cmd": "pwsh --version"
    },
    "javascript": {
        "extension": ".js",
        "compile": None,
        "run": ["node", "{file}"],
        "check_cmd": "node --version"
    },
    "ruby": {
        "extension": ".rb",
        "compile": None,
        "run": ["ruby", "{file}"],
        "check_cmd": "ruby --version"
    },
    "php": {
        "extension": ".php",
        "compile": None,
        "run": ["php", "{file}"],
        "check_cmd": "php --version"
    },
    "java": {
        "extension": ".java",
        "compile": ["javac", "{file}"],
        "run": ["java", "-cp", "{dir}", "{classname}"],
        "check_cmd": "java --version"
    },
    "csharp": {
        "extension": ".cs",
        "compile": ["mcs", "-out:{output}", "{file}"],
        "run": ["mono", "{output}"],
        "check_cmd": "mcs --version"
    },
    "assembly": {
        "extension": ".asm",
        "compile": ["nasm", "-f", "elf64", "-o", "{obj}", "{file}", "&&", "ld", "-o", "{output}", "{obj}"],
        "run": ["{output}"],
        "check_cmd": "nasm --version"
    }
}


class CompilerService:
    def __init__(self, artifacts_dir: Path):
        self.artifacts_dir = artifacts_dir
    
    async def _run_command(self, cmd: list, cwd: str = None, timeout: int = 60, env: dict = None) -> dict:
        """Ejecuta un comando de forma asíncrona."""
        try:
            proc_env = os.environ.copy()
            if env:
                proc_env.update(env)
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd,
                env=proc_env
            )
            
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)
            
            return {
                "success": process.returncode == 0,
                "stdout": stdout.decode('utf-8', errors='ignore'),
                "stderr": stderr.decode('utf-8', errors='ignore'),
                "returncode": process.returncode
            }
        except asyncio.TimeoutError:
            return {"success": False, "stdout": "", "stderr": f"Timeout ({timeout}s)", "returncode": -1}
        except FileNotFoundError as e:
            return {"success": False, "stdout": "", "stderr": f"Comando no encontrado: {e}", "returncode": -1}
        except Exception as e:
            return {"success": False, "stdout": "", "stderr": str(e), "returncode": -1}
    
    async def compile_artifact(
        self,
        artifact_id: int,
        source_code: str,
        language: str,
        artifact_name: str
    ) -> dict:
        """Compila un artefacto y devuelve la ruta del binario/script."""
        
        lang_key = language.lower().replace(" ", "").replace("#", "sharp")
        if lang_key == "c#":
            lang_key = "csharp"
        
        config = LANGUAGE_CONFIG.get(lang_key)
        if not config:
            return {
                "success": False,
                "error": f"Lenguaje no soportado: {language}",
                "compiled_path": None
            }
        
        # Crear directorio para el artefacto
        artifact_dir = self.artifacts_dir / f"artifact_{artifact_id}"
        artifact_dir.mkdir(parents=True, exist_ok=True)
        
        # Guardar código fuente
        safe_name = "".join(c for c in artifact_name if c.isalnum() or c in "_-")[:50]
        source_file = artifact_dir / f"{safe_name}{config['extension']}"
        
        with open(source_file, 'w', encoding='utf-8') as f:
            f.write(source_code)
        
        # Si no necesita compilación
        if config['compile'] is None:
            # Hacer ejecutable si es script
            source_file.chmod(0o755)
            return {
                "success": True,
                "compiled_path": str(source_file),
                "artifact_dir": str(artifact_dir),
                "output": "Script guardado (no requiere compilación)",
                "error": ""
            }
        
        # Compilar
        output_file = artifact_dir / safe_name
        obj_file = artifact_dir / f"{safe_name}.o"
        
        compile_cmd = []
        for part in config['compile']:
            part = part.replace("{file}", str(source_file))
            part = part.replace("{output}", str(output_file))
            part = part.replace("{obj}", str(obj_file))
            part = part.replace("{dir}", str(artifact_dir))
            compile_cmd.append(part)
        
        # Manejar comandos con && (shell pipeline)
        if "&&" in compile_cmd:
            cmd_str = " ".join(compile_cmd)
            result = await self._run_command(
                ["bash", "-c", cmd_str],
                cwd=str(artifact_dir),
                timeout=120
            )
        else:
            result = await self._run_command(compile_cmd, cwd=str(artifact_dir), timeout=120)
        
        if result["success"]:
            return {
                "success": True,
                "compiled_path": str(output_file),
                "artifact_dir": str(artifact_dir),
                "output": result["stdout"],
                "error": result["stderr"]
            }
        else:
            return {
                "success": False,
                "compiled_path": None,
                "artifact_dir": str(artifact_dir),
                "output": result["stdout"],
                "error": result["stderr"]
            }
    
    async def execute_artifact(
        self,
        compiled_path: str,
        language: str,
        artifact_name: str,
        args: list = None,
        env_vars: dict = None,
        timeout: int = 30
    ) -> dict:
        """Ejecuta un artefacto compilado."""
        
        lang_key = language.lower().replace(" ", "").replace("#", "sharp")
        if lang_key == "c#":
            lang_key = "csharp"
        
        config = LANGUAGE_CONFIG.get(lang_key)
        if not config:
            return {"success": False, "stdout": "", "stderr": f"Lenguaje no soportado: {language}", "returncode": -1}
        
        safe_name = "".join(c for c in artifact_name if c.isalnum() or c in "_-")[:50]
        artifact_dir = str(Path(compiled_path).parent)
        
        run_cmd = []
        for part in config['run']:
            part = part.replace("{file}", compiled_path)
            part = part.replace("{output}", compiled_path)
            part = part.replace("{dir}", artifact_dir)
            part = part.replace("{classname}", safe_name)
            run_cmd.append(part)
        
        if args:
            run_cmd.extend(args)
        
        result = await self._run_command(run_cmd, cwd=artifact_dir, timeout=timeout, env=env_vars)
        return result
    
    async def check_dependencies(self) -> dict:
        """Verifica qué compiladores/intérpretes están disponibles."""
        available = {}
        
        for lang, config in LANGUAGE_CONFIG.items():
            check_cmd = config.get("check_cmd", "").split()
            if check_cmd:
                result = await self._run_command(check_cmd, timeout=5)
                available[lang] = result["success"]
            else:
                available[lang] = False
        
        return available
    
    async def install_missing_deps(self, language: str) -> dict:
        """Intenta instalar dependencias faltantes para un lenguaje."""
        install_cmds = {
            "go": ["sudo", "apt-get", "install", "-y", "golang-go"],
            "rust": ["curl", "--proto", "=https", "--tlsv1.2", "-sSf", "https://sh.rustup.rs", "|", "sh", "-s", "--", "-y"],
            "ruby": ["sudo", "apt-get", "install", "-y", "ruby"],
            "php": ["sudo", "apt-get", "install", "-y", "php"],
            "java": ["sudo", "apt-get", "install", "-y", "default-jdk"],
            "csharp": ["sudo", "apt-get", "install", "-y", "mono-complete"],
            "assembly": ["sudo", "apt-get", "install", "-y", "nasm"],
            "powershell": ["sudo", "apt-get", "install", "-y", "powershell"]
        }
        
        cmd = install_cmds.get(language.lower())
        if not cmd:
            return {"success": False, "message": f"No hay instalación automática para {language}"}
        
        result = await self._run_command(cmd, timeout=120)
        return {
            "success": result["success"],
            "message": result["stdout"] + result["stderr"]
        }


_compiler_service_instance = None

def get_compiler_service(artifacts_dir: Path) -> CompilerService:
    global _compiler_service_instance
    if _compiler_service_instance is None:
        _compiler_service_instance = CompilerService(artifacts_dir)
    return _compiler_service_instance
