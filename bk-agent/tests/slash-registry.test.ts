import { getCompletionSuggestions, getAllSlashCommands, getCommandMeta } from '../src/commands/slash-registry';

describe('SlashRegistry - Autocompletado de Comandos', () => {
  describe('getCompletionSuggestions', () => {
    it('debería completar /spec con todos los comandos /spec.*', () => {
      const suggestions = getCompletionSuggestions('/spec');
      expect(suggestions).toContain('/spec.prompt');
      expect(suggestions).toContain('/spec.specify');
      expect(suggestions).toContain('/spec.plan');
      expect(suggestions).toContain('/spec.init');
      expect(suggestions).toContain('/spec.next');
      expect(suggestions).toContain('/spec.run');
      expect(suggestions).toContain('/spec.qa');
      expect(suggestions).toContain('/spec.advance');
      expect(suggestions).toContain('/spec.go');
      expect(suggestions.length).toBeGreaterThan(5);
    });

    it('debería completar /spec.show con subcomandos', () => {
      const suggestions = getCompletionSuggestions('/spec.show');
      expect(suggestions).toEqual([
        '/spec.show.prompt',
        '/spec.show.specify',
        '/spec.show.plan',
        '/spec.show.roadmap',
      ]);
    });

    it('debería completar /spec.revise con subcomandos', () => {
      const suggestions = getCompletionSuggestions('/spec.revise');
      expect(suggestions).toEqual([
        '/spec.revise.prompt',
        '/spec.revise.specify',
        '/spec.revise.plan',
      ]);
    });

    it('debería completar /checkpoint con subcomandos', () => {
      const suggestions = getCompletionSuggestions('/checkpoint');
      expect(suggestions).toEqual([
        '/checkpoint create',
        '/checkpoint list',
        '/checkpoint load',
        '/checkpoint delete',
      ]);
    });

    it('debería completar /workspace con subcomandos', () => {
      const suggestions = getCompletionSuggestions('/workspace');
      expect(suggestions).toContain('/workspace create');
      expect(suggestions).toContain('/workspace add');
      expect(suggestions).toContain('/workspace remove');
      expect(suggestions).toContain('/workspace list');
    });

    it('debería completar /spec.s (partial match)', () => {
      const suggestions = getCompletionSuggestions('/spec.s');
      expect(suggestions).toContain('/spec.show');
      expect(suggestions).toContain('/spec.specify');
    });

    it('debería completar /chec (partial match para /checkpoint)', () => {
      const suggestions = getCompletionSuggestions('/chec');
      expect(suggestions).toContain('/checkpoint');
    });

    it('debería retornar array vacío para entrada sin slash', () => {
      const suggestions = getCompletionSuggestions('prueba sin slash');
      expect(suggestions).toEqual([]);
    });

    it('debería retornar array vacío si no hay coincidencias', () => {
      const suggestions = getCompletionSuggestions('/xyz123');
      expect(suggestions).toEqual([]);
    });

    it('debería listar todos los comandos /agent', () => {
      const suggestions = getCompletionSuggestions('/agent');
      expect(suggestions).toContain('/agent');
    });
  });

  describe('getAllSlashCommands', () => {
    it('debería incluir todos los comandos base', () => {
      const commands = getAllSlashCommands();
      expect(commands).toContain('/help');
      expect(commands).toContain('/clear');
      expect(commands).toContain('/status');
      expect(commands).toContain('/memory');
      expect(commands).toContain('/agent');
      expect(commands).toContain('/models');
    });

    it('debería incluir todos los subcomandos /spec.*', () => {
      const commands = getAllSlashCommands();
      expect(commands).toContain('/spec.prompt');
      expect(commands).toContain('/spec.show.prompt');
      expect(commands).toContain('/spec.revise.prompt');
    });

    it('debería incluir todos los subcomandos /checkpoint', () => {
      const commands = getAllSlashCommands();
      expect(commands).toContain('/checkpoint create');
      expect(commands).toContain('/checkpoint list');
      expect(commands).toContain('/checkpoint load');
    });

    it('debería tener más de 30 comandos', () => {
      const commands = getAllSlashCommands();
      expect(commands.length).toBeGreaterThan(30);
    });
  });

  describe('getCommandMeta', () => {
    it('debería retornar metadata de /help', () => {
      const meta = getCommandMeta('/help');
      expect(meta).toBeDefined();
      expect(meta?.name).toBe('/help');
      expect(meta?.description).toBe('Muestra los comandos disponibles');
    });

    it('debería retornar metadata de /checkpoint con subcomandos', () => {
      const meta = getCommandMeta('/checkpoint');
      expect(meta).toBeDefined();
      expect(meta?.subcommands).toBeDefined();
      expect(meta?.subcommands?.length).toBe(4);
    });

    it('debería retornar undefined para comando inexistente', () => {
      const meta = getCommandMeta('/xyz123');
      expect(meta).toBeUndefined();
    });

    it('debería incluir grupo en metadata', () => {
      const meta = getCommandMeta('/spec.prompt');
      expect(meta?.group).toBeDefined();
      expect(meta?.group).toContain('Especificación');
    });
  });

  describe('Completado realista (casos de uso)', () => {
    it('usuario escribe /spec<TAB> y ve todos los /spec.*', () => {
      const suggestions = getCompletionSuggestions('/spec');
      const firstSuggestion = suggestions[0];
      expect(firstSuggestion).toMatch(/^\/spec\./);
    });

    it('usuario escribe /spec.show<TAB> y ve solo subcomandos .show', () => {
      const suggestions = getCompletionSuggestions('/spec.show');
      expect(suggestions.every(s => s.startsWith('/spec.show'))).toBe(true);
    });

    it('usuario escribe /check<TAB> (typo) y ve /checkpoint', () => {
      const suggestions = getCompletionSuggestions('/check');
      expect(suggestions).toContain('/checkpoint');
    });

    it('usuario escribe /a<TAB> y ve /agent', () => {
      const suggestions = getCompletionSuggestions('/a');
      expect(suggestions).toContain('/agent');
    });

    it('usuario escribe /w<TAB> y ve /workspace', () => {
      const suggestions = getCompletionSuggestions('/w');
      expect(suggestions).toContain('/workspace');
    });
  });
});
