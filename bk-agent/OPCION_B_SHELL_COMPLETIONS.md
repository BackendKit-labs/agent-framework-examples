# 📋 Opción B: Shell Completions (Para Análisis Posterior)

## Resumen
Implementar autocompletado nativo en shell (bash, zsh, powershell) para que funcione cuando se ejecuta `bk-agent` directamente desde la terminal, sin necesidad de entrar al REPL.

## Estado: ⏸️ EN ESPERA (Guardado para revisión posterior)

---

## Descripción General

### ¿Qué es?
Sistema que habilita autocompletado en:
- **Bash:** `eval "$(bk-agent completion bash)"`
- **Zsh:** `eval "$(bk-agent completion zsh)"`
- **PowerShell:** `. (bk-agent completion powershell | Out-String)`

### ¿Cuándo se usa?
```bash
# Sin Opción B (hoy):
$ bk-agent /checkpoint<TAB>  # No funciona
$ bk-agent /spec.show<TAB>   # No funciona

# Con Opción B (futuro):
$ bk-agent /checkpoint<TAB>  # ✅ Muestra: create delete list load
$ bk-agent /spec.show<TAB>   # ✅ Muestra: .plan .prompt .roadmap .specify
```

---

## Propuesta de Implementación

### Archivos a Crear

```
src/shell-completion.ts          (Generador de scripts)
src/bin/completion.bash          (Script bash completion)
src/bin/completion.zsh           (Script zsh completion - opcional)
src/bin/completion.powershell    (Script powershell completion - opcional)
```

### Archivos a Modificar

```
bin/cli.ts                       (Registrar comando 'completion')
package.json                     (Scripts de instalación)
README.md                        (Documentación)
```

---

## Flujo Propuesto

### 1. Comando Disponible
```bash
$ bk-agent completion --help
Generate shell completion script

Usage: bk-agent completion <shell>

Shells:
  bash      - Bash completion (Linux/macOS)
  zsh       - Zsh completion (macOS)
  pwsh      - PowerShell completion (Windows)
```

### 2. Instalación (Una sola vez)
```bash
# Bash
eval "$(bk-agent completion bash)" >> ~/.bashrc

# Zsh
eval "$(bk-agent completion zsh)" >> ~/.zshrc

# PowerShell
bk-agent completion powershell | Out-String | Add-Content -Path $PROFILE
```

### 3. Uso
```bash
$ bk-agent /checkpoint<TAB>
create  delete  list  load
```

---

## Estimación de Esfuerzo

| Fase | Tiempo | Complejidad |
|------|--------|-------------|
| Crear generador (shell-completion.ts) | 2h | Media |
| Bash completion script | 1h | Baja |
| Zsh completion script | 1h | Media |
| PowerShell completion script | 1.5h | Media |
| Tests | 2h | Media |
| Documentación | 1h | Baja |
| **Total** | **8.5h** | **Media** |

---

## Código Base (Listo para Implementar)

### Estructura de `src/shell-completion.ts`

```typescript
import { Command } from 'commander';

export function createCompletionCommand(program: Command): Command {
  const completionCmd = new Command('completion')
    .description('Generate shell completion script')
    .arguments('<shell>')
    .option('-o, --output <file>', 'Save to file instead of stdout')
    .action(async (shell, options) => {
      const script = generateCompletionScript(shell);
      if (options.output) {
        const fs = await import('fs');
        fs.writeFileSync(options.output, script);
      } else {
        console.log(script);
      }
    });

  return completionCmd;
}

function generateCompletionScript(shell: string): string {
  switch (shell) {
    case 'bash': return generateBashCompletion();
    case 'zsh': return generateZshCompletion();
    case 'pwsh': case 'powershell': return generatePowershellCompletion();
    default: throw new Error(`Unsupported shell: ${shell}`);
  }
}

function generateBashCompletion(): string {
  return `#!/bin/bash
# bk-agent bash completion

_bk_agent_complete() {
  local cur prev words cword
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  # Main commands
  local commands="/help /clear /status /memory /agent /models /skills /init /prompt /switch /workspace /checkpoint /spec.prompt /spec.specify /spec.plan /spec.show /spec.revise /spec.init /spec.next /spec.run /spec.qa /spec.advance /spec.go"

  if [[ \$COMP_CWORD -eq 1 ]]; then
    COMPREPLY=($(compgen -W "\$commands" -- "\$cur"))
  fi
}

complete -o bashdefault -o default -o nospace -F _bk_agent_complete bk-agent
complete -o bashdefault -o default -o nospace -F _bk_agent_complete deepseek-code
`;
}

function generateZshCompletion(): string {
  return `#compdef bk-agent deepseek-code

_bk_agent() {
  local -a commands=(
    '/help:Muestra los comandos disponibles'
    '/clear:Limpiar pantalla'
    '/checkpoint:Gestionar checkpoints'
    '/workspace:Gestionar workspaces'
    '/spec.show:Mostrar documentos'
    '/spec.run:Ejecutar fase'
  )

  _describe 'bk-agent' commands
}

_bk_agent
`;
}

function generatePowershellCompletion(): string {
  return `# PowerShell completion for bk-agent

$scriptblock = {
  param($wordToComplete, $commandAst, $cursorPosition)

  $tokens = $commandAst.ToString().Split()
  $firstArg = if ($tokens.Count -gt 1) { $tokens[1] } else { '' }
  
  $allCommands = @('/help', '/clear', '/status', '/memory', '/agent', '/models', '/skills', '/init', '/prompt', '/switch', '/workspace', '/checkpoint', '/spec.prompt', '/spec.specify', '/spec.plan', '/spec.show', '/spec.revise', '/spec.init', '/spec.next', '/spec.run', '/spec.qa', '/spec.advance', '/spec.go')
  
  $allCommands | Where-Object { $_ -like "\$wordToComplete*" } | 
    ForEach-Object { [System.Management.Automation.CompletionResult]::new($_) }
}

Register-ArgumentCompleter -CommandName bk-agent -ScriptBlock \$scriptblock
Register-ArgumentCompleter -CommandName deepseek-code -ScriptBlock \$scriptblock
`;
}
```

---

## Integración en `bin/cli.ts`

```typescript
import { createCompletionCommand } from '../src/shell-completion';

const program = new Command();
// ... programa existente ...

// Agregar comando completion
program.addCommand(createCompletionCommand(program));

program.parse();
```

---

## Documentación Propuesta

### En README.md

```markdown
## Shell Completion

Para habilitar autocompletado en tu shell:

### Bash
\`\`\`bash
eval "$(bk-agent completion bash)" >> ~/.bashrc
source ~/.bashrc
\`\`\`

### Zsh
\`\`\`bash
eval "$(bk-agent completion zsh)" >> ~/.zshrc
source ~/.zshrc
\`\`\`

### PowerShell
\`\`\`powershell
bk-agent completion powershell | Out-String | Add-Content -Path $PROFILE
. $PROFILE
\`\`\`

### Verificar Instalación
\`\`\`bash
bk-agent /spec<TAB>  # Debería mostrar sugerencias
\`\`\`
```

---

## Ventajas vs Desventajas

### ✅ Ventajas
- Autocompletado nativo en shell (profesional)
- Compatible con bash, zsh, powershell
- Funciona fuera del REPL
- Estándar de industria (como npm, git, docker)
- Instalación simple (una sola vez)

### ❌ Desventajas
- Requiere instalación manual
- Scripts específicos por shell
- Mantenimiento adicional
- No funciona en todos los shells (fish, tcsh, etc)
- Complejidad media

---

## Alternativas Consideradas

### 1. No Implementar
- ❌ Menos profesional
- ❌ Usuarios avanzados frustrados
- ✅ Menos código

### 2. Usar librería (omelette, tabtab)
- ❌ Dependencia externa
- ✅ Menos código
- ✅ Más robusto

### 3. Scripts personalizados (propuesto)
- ✅ Control total
- ✅ Sin dependencias
- ❌ Más código

---

## Riesgos y Mitigación

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|-----------|
| Scripts shell rotos | Media | Tests, CI/CD |
| Incompatibilidad de shells | Baja | Testear en bash/zsh/pwsh |
| Conflictos con completados existentes | Baja | Nombrar funciones únicamente |
| Instalación fallida | Media | Documentación clara + script helper |

---

## Testing Propuesto

```typescript
describe('Shell Completion', () => {
  it('debería generar script bash válido', () => {
    const script = generateBashCompletion();
    expect(script).toContain('_bk_agent_complete');
    expect(script).toContain('/checkpoint');
    expect(script).toContain('/spec.show');
  });

  it('debería generar script zsh válido', () => {
    const script = generateZshCompletion();
    expect(script).toContain('#compdef');
    expect(script).toContain('bk-agent');
  });

  it('debería generar script powershell válido', () => {
    const script = generatePowershellCompletion();
    expect(script).toContain('Register-ArgumentCompleter');
  });

  it('debería rechazar shells no soportados', () => {
    expect(() => generateCompletionScript('fish')).toThrow();
  });
});
```

---

## Hoja de Ruta de Implementación

### Fase 1: Preparación (30 min)
- [ ] Crear `src/shell-completion.ts`
- [ ] Crear scripts vacíos
- [ ] Registrar comando en `bin/cli.ts`

### Fase 2: Bash (1.5h)
- [ ] Implementar `generateBashCompletion()`
- [ ] Probar en bash local
- [ ] Escribir tests

### Fase 3: Zsh (1h)
- [ ] Implementar `generateZshCompletion()`
- [ ] Probar en zsh local
- [ ] Escribir tests

### Fase 4: PowerShell (1.5h)
- [ ] Implementar `generatePowershellCompletion()`
- [ ] Probar en PowerShell local
- [ ] Escribir tests

### Fase 5: Documentación (1h)
- [ ] Actualizar README
- [ ] Agregar guía de instalación
- [ ] Ejemplos de uso

### Fase 6: CI/CD (1h)
- [ ] Tests en pipeline
- [ ] Validar scripts en CI
- [ ] Build documentation

---

## Costo-Beneficio

| Métrica | Valor |
|---------|-------|
| **Esfuerzo** | 8.5h |
| **Impacto** | Alto (usuarios avanzados) |
| **Complejidad** | Media |
| **Mantenibilidad** | Media (3 scripts que mantener) |
| **Dependencias** | 0 (sin cambios) |

---

## Decisión Recomendada

**Opción B es útil si:**
- ✅ Usuarios avanzados queiren CLI tradicional
- ✅ Quieres competir con npm/git/docker
- ✅ Tienes tiempo disponible

**Opción B puede esperar si:**
- ✅ Prioridad es mejorar Opción A primero
- ✅ Usuarios principalmente usan REPL
- ✅ Poco tiempo disponible

---

## Próximos Pasos

### Cuando decidas implementar Opción B:
1. Leer este documento completo
2. Revisar código base proporcionado
3. Seguir hoja de ruta (6 fases)
4. Ejecutar tests en cada fase
5. Crear PR con documentación

### Por Ahora:
- ✅ Opción A está lista y funcional
- ✅ Usuarios ven mejora inmediata en REPL
- ⏸️ Opción B guardada para análisis posterior

---

## Referencias

- [Commander.js Completions](https://github.com/tj/commander.js/blob/master/examples/completion.js)
- [Bash Completion Guide](https://www.gnu.org/software/bash/manual/html_node/Programmable-Completion.html)
- [Zsh Completion](https://zsh.sourceforge.io/Doc/Release/Completion-System.html)
- [PowerShell Register-ArgumentCompleter](https://docs.microsoft.com/en-us/powershell/module/psreadline/register-argumentcompleter)

---

**Última actualización:** 2026-06-14
**Estado:** En espera para análisis posterior
**Acción requerida:** Ninguna por ahora
