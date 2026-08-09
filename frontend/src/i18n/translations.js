export const translations = {
  es: {
    // Navigation
    nav: {
      dashboard: "Panel Principal",
      clients: "Clientes",
      engagements: "Engagements",
      artifacts: "Artefactos",
      chat: "Asistente IA",
      knowledge: "Base de Conocimiento",
      reports: "Reportes",
      tools: "Herramientas",
      settings: "Configuración"
    },
    // Dashboard
    dashboard: {
      title: "RedTeam Forge",
      subtitle: "Plataforma de Ethical Hacking & Malware Development",
      totalClients: "Clientes Totales",
      activeEngagements: "Engagements Activos",
      totalArtifacts: "Artefactos Generados",
      totalReports: "Reportes Generados",
      recentActivity: "Actividad Reciente",
      quickActions: "Acciones Rápidas",
      newArtifact: "Nuevo Artefacto",
      newEngagement: "Nuevo Engagement",
      askKnowledge: "Consultar Conocimiento",
      generateReport: "Generar Reporte"
    },
    // Clients
    clients: {
      title: "Gestión de Clientes",
      addClient: "Añadir Cliente",
      editClient: "Editar Cliente",
      deleteClient: "Eliminar Cliente",
      name: "Nombre",
      company: "Empresa",
      email: "Email",
      phone: "Teléfono",
      notes: "Notas",
      engagements: "Engagements",
      noClients: "No hay clientes registrados",
      confirmDelete: "¿Eliminar este cliente y todos sus datos?"
    },
    // Engagements
    engagements: {
      title: "Engagements",
      addEngagement: "Nuevo Engagement",
      name: "Nombre del Engagement",
      client: "Cliente",
      scope: "Alcance (Scope)",
      targets: "Objetivos (IPs/Dominios)",
      status: "Estado",
      active: "Activo",
      completed: "Completado",
      paused: "Pausado",
      notes: "Notas",
      authorization: "Documento de Autorización",
      noEngagements: "No hay engagements activos"
    },
    // Artifacts
    artifacts: {
      title: "Generador de Artefactos",
      generate: "Generar Artefacto",
      name: "Nombre del Artefacto",
      type: "Tipo",
      language: "Lenguaje",
      description: "Descripción / Objetivo",
      targetInfo: "Información del Objetivo",
      techniques: "Técnicas a Implementar",
      autoCompile: "Compilar Automáticamente",
      compile: "Compilar",
      execute: "Ejecutar",
      viewCode: "Ver Código",
      editCode: "Editar Código",
      status: {
        generated: "Generado",
        compiled: "Compilado",
        executed: "Ejecutado",
        compile_failed: "Error de Compilación",
        execution_failed: "Error de Ejecución"
      },
      output: "Salida de Ejecución",
      error: "Error",
      generating: "Generando artefacto con Claude...",
      compiling: "Compilando...",
      executing: "Ejecutando...",
      selectEngagement: "Seleccionar Engagement",
      noArtifacts: "No hay artefactos generados"
    },
    // Chat
    chat: {
      title: "Asistente Red Team",
      placeholder: "Pregunta sobre técnicas, herramientas, exploits...",
      send: "Enviar",
      modes: {
        chat: "Chat Libre",
        rag: "Base de Conocimiento",
        codegen: "Generación de Código"
      },
      thinking: "Pensando...",
      sources: "Fuentes consultadas",
      clearHistory: "Limpiar Historial"
    },
    // Knowledge Base
    knowledge: {
      title: "Base de Conocimiento",
      subtitle: "Consulta los 4 libros de ciberseguridad indexados",
      books: [
        "Malware Development for Ethical Hackers (Zhussupov, 2024)",
        "Advanced Python for Cybersecurity (Jones, 2024)",
        "Web Hacking Arsenal (Baloch, 2024)",
        "The Hack Is Back (Varsalone & Haller, 2024)"
      ],
      searchPlaceholder: "Buscar en la base de conocimiento...",
      search: "Buscar",
      results: "Resultados",
      noResults: "No se encontraron resultados",
      initRAG: "Inicializar/Reconstruir Índice RAG",
      ragStatus: "Estado del RAG"
    },
    // Reports
    reports: {
      title: "Reportes de Vulnerabilidades",
      generate: "Generar Reporte",
      download: "Descargar PDF",
      title_field: "Título del Reporte",
      target: "Objetivo Analizado",
      scanOutput: "Output de Escaneo/Herramientas",
      includeArtifacts: "Incluir Output de Artefactos",
      severity: {
        critical: "Crítico",
        high: "Alto",
        medium: "Medio",
        low: "Bajo",
        info: "Informativo"
      },
      findings: "Hallazgos",
      remediation: "Remediación",
      noReports: "No hay reportes generados"
    },
    // Common
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      close: "Cerrar",
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      confirm: "Confirmar",
      back: "Volver",
      next: "Siguiente",
      search: "Buscar",
      filter: "Filtrar",
      refresh: "Actualizar",
      copy: "Copiar",
      copied: "¡Copiado!",
      noData: "Sin datos",
      required: "Campo requerido"
    }
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      clients: "Clients",
      engagements: "Engagements",
      artifacts: "Artifacts",
      chat: "AI Assistant",
      knowledge: "Knowledge Base",
      reports: "Reports",
      tools: "Tools",
      settings: "Settings"
    },
    dashboard: {
      title: "RedTeam Forge",
      subtitle: "Ethical Hacking & Malware Development Platform",
      totalClients: "Total Clients",
      activeEngagements: "Active Engagements",
      totalArtifacts: "Generated Artifacts",
      totalReports: "Generated Reports",
      recentActivity: "Recent Activity",
      quickActions: "Quick Actions",
      newArtifact: "New Artifact",
      newEngagement: "New Engagement",
      askKnowledge: "Query Knowledge Base",
      generateReport: "Generate Report"
    },
    clients: {
      title: "Client Management",
      addClient: "Add Client",
      editClient: "Edit Client",
      deleteClient: "Delete Client",
      name: "Name",
      company: "Company",
      email: "Email",
      phone: "Phone",
      notes: "Notes",
      engagements: "Engagements",
      noClients: "No clients registered",
      confirmDelete: "Delete this client and all their data?"
    },
    engagements: {
      title: "Engagements",
      addEngagement: "New Engagement",
      name: "Engagement Name",
      client: "Client",
      scope: "Scope",
      targets: "Targets (IPs/Domains)",
      status: "Status",
      active: "Active",
      completed: "Completed",
      paused: "Paused",
      notes: "Notes",
      authorization: "Authorization Document",
      noEngagements: "No active engagements"
    },
    artifacts: {
      title: "Artifact Generator",
      generate: "Generate Artifact",
      name: "Artifact Name",
      type: "Type",
      language: "Language",
      description: "Description / Objective",
      targetInfo: "Target Information",
      techniques: "Techniques to Implement",
      autoCompile: "Auto-Compile",
      compile: "Compile",
      execute: "Execute",
      viewCode: "View Code",
      editCode: "Edit Code",
      status: {
        generated: "Generated",
        compiled: "Compiled",
        executed: "Executed",
        compile_failed: "Compile Failed",
        execution_failed: "Execution Failed"
      },
      output: "Execution Output",
      error: "Error",
      generating: "Generating artifact with Claude...",
      compiling: "Compiling...",
      executing: "Executing...",
      selectEngagement: "Select Engagement",
      noArtifacts: "No artifacts generated"
    },
    chat: {
      title: "Red Team Assistant",
      placeholder: "Ask about techniques, tools, exploits...",
      send: "Send",
      modes: {
        chat: "Free Chat",
        rag: "Knowledge Base",
        codegen: "Code Generation"
      },
      thinking: "Thinking...",
      sources: "Consulted sources",
      clearHistory: "Clear History"
    },
    knowledge: {
      title: "Knowledge Base",
      subtitle: "Query the 4 indexed cybersecurity books",
      books: [
        "Malware Development for Ethical Hackers (Zhussupov, 2024)",
        "Advanced Python for Cybersecurity (Jones, 2024)",
        "Web Hacking Arsenal (Baloch, 2024)",
        "The Hack Is Back (Varsalone & Haller, 2024)"
      ],
      searchPlaceholder: "Search the knowledge base...",
      search: "Search",
      results: "Results",
      noResults: "No results found",
      initRAG: "Initialize/Rebuild RAG Index",
      ragStatus: "RAG Status"
    },
    reports: {
      title: "Vulnerability Reports",
      generate: "Generate Report",
      download: "Download PDF",
      title_field: "Report Title",
      target: "Analyzed Target",
      scanOutput: "Scan/Tool Output",
      includeArtifacts: "Include Artifact Output",
      severity: {
        critical: "Critical",
        high: "High",
        medium: "Medium",
        low: "Low",
        info: "Informational"
      },
      findings: "Findings",
      remediation: "Remediation",
      noReports: "No reports generated"
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      close: "Close",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      confirm: "Confirm",
      back: "Back",
      next: "Next",
      search: "Search",
      filter: "Filter",
      refresh: "Refresh",
      copy: "Copy",
      copied: "Copied!",
      noData: "No data",
      required: "Required field"
    }
  }
};

export const useTranslation = (lang = 'es') => {
  const t = (key) => {
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    return value || key;
  };
  return { t };
};
