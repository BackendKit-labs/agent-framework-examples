/**
 * @description Registro centralizado de slash commands con metadata para autocompletado
 *
 * Proporciona:
 * - Lista de todos los comandos disponibles
 * - Subcomandos para grupos (/spec.*, /checkpoint, /workspace)
 * - Argumentos esperados
 * - Descripciones para ayuda
 */

export interface SlashCommandMeta {
  name: string;
  description: string;
  group: string;
  args?: string;
  subcommands?: SlashSubcommand[];
}

export interface SlashSubcommand {
  name: string;
  description?: string;
  args?: string;
}

export const SLASH_COMMANDS_META: SlashCommandMeta[] = [
  // ── Sistema ───────────────────────────────────────────────────────────
  {
    name: '/help',
    description: 'Muestra los comandos disponibles',
    group: 'Sistema',
  },
  {
    name: '/clear',
    description: 'Limpiar pantalla',
    group: 'Sistema',
  },
  {
    name: '/reset-context',
    description: 'Reiniciar conversación (mantiene sistema)',
    group: 'Sistema',
  },
  {
    name: '/context',
    description: 'Ver contexto activo del proyecto',
    group: 'Sistema',
  },
  {
    name: '/tokens',
    description: 'Uso de tokens en el contexto actual',
    group: 'Sistema',
  },
  {
    name: '/usage',
    description: 'Tokens y costo de sub-agentes en esta sesión',
    group: 'Sistema',
  },
  {
    name: '/status',
    description: 'Panel de estado del sistema',
    group: 'Sistema',
  },
  {
    name: '/memory',
    description: 'Ver memoria persistente del proyecto activo',
    group: 'Sistema',
  },

  // ── Configuración ────────────────────────────────────────────────────
  {
    name: '/agent',
    description: 'Lista o cambia el agente activo',
    group: 'Configuración',
    args: '[id]',
  },
  {
    name: '/models',
    description: 'Lista o cambia el modelo de IA',
    group: 'Configuración',
    args: '[id]',
  },
  {
    name: '/iteration',
    description: 'Ver o cambiar modo de iteración',
    group: 'Configuración',
  },

  // ── Almacenamiento ───────────────────────────────────────────────────
  {
    name: '/skills',
    description: 'Ver, instalar o crear skills',
    group: 'Almacenamiento',
  },
  {
    name: '/init',
    description: 'Inicializar o analizar proyecto con project-manager',
    group: 'Almacenamiento',
  },
  {
    name: '/prompt',
    description: 'Genera un prompt estructurado desde una frase',
    group: 'Almacenamiento',
    args: 'new <frase>',
  },
  {
    name: '/switch',
    description: 'Cambiar workspace/proyecto activo (picker TUI)',
    group: 'Almacenamiento',
    args: '[ws] [proj]',
  },
  {
    name: '/workspace',
    description: 'Gestionar workspaces',
    group: 'Almacenamiento',
    args: '[sub]',
    subcommands: [
      { name: 'create', description: 'Crear nuevo workspace', args: '[--name]' },
      { name: 'add', description: 'Agregar ruta al workspace', args: '[--path]' },
      { name: 'remove', description: 'Eliminar workspace', args: '[--name]' },
      { name: 'delete', description: 'Borrar workspace completamente', args: '[--name]' },
      { name: 'list', description: 'Listar todos los workspaces' },
    ],
  },
  {
    name: '/checkpoint',
    description: 'Gestionar checkpoints de sesión',
    group: 'Almacenamiento',
    subcommands: [
      { name: 'create', description: 'Crear checkpoint de sesión', args: '[--name]' },
      { name: 'list', description: 'Listar checkpoints disponibles' },
      { name: 'load', description: 'Cargar checkpoint por ID', args: '<n>' },
      { name: 'delete', description: 'Eliminar checkpoint', args: '<id>' },
    ],
  },

  // ── Especificación (Spec-Driven Development) ──────────────────────────
  // Design phase
  {
    name: '/spec.prompt',
    description: 'Guarda requisitos iniciales en prompt.md',
    group: 'Especificación › Design',
    args: '<descripción>',
  },
  {
    name: '/spec.specify',
    description: 'Genera specification.md desde prompt.md',
    group: 'Especificación › Design',
    args: '[hint]',
  },
  {
    name: '/spec.plan',
    description: 'Genera design.md (arquitectura) desde la especificación',
    group: 'Especificación › Design',
    args: '[hint]',
  },

  // Show — lee archivos directamente sin coste LLM
  {
    name: '/spec.show',
    description: 'Muestra documentos sin coste LLM',
    group: 'Especificación › Visualizar',
    subcommands: [
      { name: '.prompt', description: 'Muestra prompt.md' },
      { name: '.specify', description: 'Muestra specification.md' },
      { name: '.plan', description: 'Muestra design.md (arquitectura)' },
      { name: '.roadmap', description: 'Muestra roadmap de fases', args: '[fase]' },
    ],
  },

  // Revise — itera sobre documentos existentes
  {
    name: '/spec.revise',
    description: 'Corrige o amplía documentos existentes',
    group: 'Especificación › Diseño',
    subcommands: [
      { name: '.prompt', description: 'Corrige o amplía prompt.md', args: '<feedback>' },
      { name: '.specify', description: 'Corrige o amplía specification.md', args: '<feedback>' },
      { name: '.plan', description: 'Corrige o amplía design.md', args: '<feedback>' },
    ],
  },

  // Execution phase
  {
    name: '/spec.init',
    description: 'Inicializa el roadmap de fases desde los documentos',
    group: 'Especificación › Ejecución',
  },
  {
    name: '/spec.next',
    description: 'Muestra instrucciones de la etapa actual y activa modo driving',
    group: 'Especificación › Ejecución',
  },
  {
    name: '/spec.run',
    description: 'Genera código de la fase actual — orquesta especialistas',
    group: 'Especificación › Ejecución',
  },
  {
    name: '/spec.qa',
    description: 'QA evalúa la fase actual y guarda hallazgos',
    group: 'Especificación › Ejecución',
  },
  {
    name: '/spec.advance',
    description: 'Avanza de etapa',
    group: 'Especificación › Ejecución',
    args: '[notas] [--passed|--failed]',
  },
  {
    name: '/spec.go',
    description: 'Ejecuta todas las fases de forma autónoma hasta completar',
    group: 'Especificación › Ejecución',
  },
];

/**
 * Extrae la lista plana de todos los slash commands
 */
export function getAllSlashCommands(): string[] {
  const commands = SLASH_COMMANDS_META.map(cmd => cmd.name);
  const withSubcommands: string[] = [];

  for (const cmd of SLASH_COMMANDS_META) {
    if (cmd.subcommands) {
      for (const sub of cmd.subcommands) {
        // Si el subcomando empieza con punto (ej: .prompt), concatenar sin espacio
        // Si no empieza con punto (ej: create), agregar con espacio
        const separator = sub.name.startsWith('.') ? '' : ' ';
        withSubcommands.push(cmd.name + separator + sub.name);
      }
    }
  }

  return [...commands, ...withSubcommands];
}

/**
 * Busca metadata de un comando
 */
export function getCommandMeta(name: string): SlashCommandMeta | undefined {
  return SLASH_COMMANDS_META.find(cmd => cmd.name === name);
}

/**
 * Busca subcomandos de un grupo (ej: /spec. → show, revise, init, etc)
 */
export function getSubcommands(baseName: string): SlashSubcommand[] {
  const cmd = getCommandMeta(baseName);
  return cmd?.subcommands ?? [];
}

/**
 * Obtiene sugerencias de completado para una línea de entrada
 * Usado por el completer en terminal.ts
 */
export function getCompletionSuggestions(line: string): string[] {
  const trimmed = line.trim();

  // Si no hay nada, no sugerir nada
  if (!trimmed || !trimmed.startsWith('/')) {
    return [];
  }

  // CASO 1: Comandos que terminan con punto + posible subcomando
  // Ejemplos: /spec.show<TAB>, /spec.revise<TAB>, /spec.prompt<TAB>
  const dotCmdMatch = trimmed.match(/^(\/\w+\.\w*)$/);
  if (dotCmdMatch) {
    const input = dotCmdMatch[1];

    // Primero: buscar si el comando COMPLETO existe y tiene subcomandos
    const exactCmd = SLASH_COMMANDS_META.find(cmd => cmd.name === input);
    if (exactCmd?.subcommands) {
      return exactCmd.subcommands.map(sub => input + sub.name);
    }

    // Segundo: buscar todos los /spec.show.* que empiezan con lo escrito
    const groupMatches = SLASH_COMMANDS_META
      .filter(cmd => cmd.name.startsWith(input))
      .map(cmd => cmd.name);

    if (groupMatches.length > 0) {
      return groupMatches;
    }
  }

  // CASO 2: Grupo /spec (sin punto final)
  // Retorna /spec., /spec.show.*, /spec.revise.*, etc.
  if (trimmed === '/spec') {
    return SLASH_COMMANDS_META
      .filter(cmd => cmd.name.startsWith('/spec'))
      .map(cmd => cmd.name);
  }

  // CASO 3: Comandos con subcomandos usando espacio (sin punto)
  // Ejemplos: /checkpoint<TAB>, /workspace<TAB>
  const spaceCmdMatch = trimmed.match(/^(\/\w+)$/);
  if (spaceCmdMatch) {
    const input = spaceCmdMatch[1];
    const cmd = SLASH_COMMANDS_META.find(c => c.name === input);

    // Si tiene subcomandos, mostrarlos con espacio
    if (cmd?.subcommands) {
      return cmd.subcommands.map(sub => input + ' ' + sub.name);
    }

    // Si no tiene subcomandos, buscar comandos que empiezan con esto
    const matches = SLASH_COMMANDS_META
      .filter(c => c.name.startsWith(input))
      .map(c => c.name);

    if (matches.length > 0) {
      return matches;
    }
  }

  // CASO 4: Completado general - cualquier comando que empiece con lo escrito
  const matches = SLASH_COMMANDS_META
    .filter(cmd => cmd.name.startsWith(trimmed))
    .map(cmd => cmd.name);

  return matches;
}
