import OpenAI from 'openai';
import type { LLMProvider, LLMMessage, LLMStreamCallbacks, ToolDefinition } from '@backendkit-labs/agent-core';

export class DeepSeekProvider implements LLMProvider {
    private readonly client: OpenAI;
    private readonly model: string;
    private readonly maxRetries: number;

    constructor(opts: { apiKey: string; model?: string; maxRetries?: number }) {
        this.client = new OpenAI({
            apiKey: opts.apiKey,
            baseURL: 'https://api.deepseek.com/v1',
            maxRetries: 0,
        });
        this.model = opts.model || 'deepseek-v4-flash';
        this.maxRetries = opts.maxRetries ?? 3;
    }

    async chat(messages: LLMMessage[], tools: ToolDefinition[], callbacks: LLMStreamCallbacks): Promise<void> {
        const oaiTools = tools.map(t => ({
            type: 'function' as const,
            function: { name: t.name, description: t.description, parameters: t.parameters },
        }));

        let attempt = 0;
        let emitted = false;

        while (attempt < this.maxRetries) {
            attempt++;
            try {
                const stream = await this.client.chat.completions.create({
                    model: this.model,
                    messages: messages as any,
                    tools: oaiTools.length ? oaiTools : undefined,
                    tool_choice: oaiTools.length ? 'auto' : undefined,
                    stream: true,
                });

                let content = '';
                const toolBuffers = new Map<number, { id: string; name: string; args: string }>();

                for await (const chunk of stream) {
                    emitted = true;
                    if (chunk.usage) callbacks.onMetrics?.(chunk.usage.prompt_tokens || 0, chunk.usage.completion_tokens || 0);
                    const delta = chunk.choices[0]?.delta;
                    if (!delta) continue;
                    if (delta.content) {
                        content += delta.content;
                        callbacks.onChunk?.(delta.content);
                    }
                    if (delta.tool_calls) {
                        for (const tc of delta.tool_calls) {
                            if (!toolBuffers.has(tc.index)) toolBuffers.set(tc.index, { id: '', name: '', args: '' });
                            const buf = toolBuffers.get(tc.index)!;
                            if (tc.id) buf.id = tc.id;
                            if (tc.function?.name) buf.name += tc.function.name;
                            if (tc.function?.arguments) buf.args += tc.function.arguments;
                        }
                    }
                }

                const toolCalls = [...toolBuffers.entries()]
                    .sort(([a], [b]) => a - b)
                    .map(([, b]) => ({ id: b.id, type: 'function' as const, function: { name: b.name, arguments: b.args } }));

                for (const tc of toolCalls) callbacks.onToolCall?.(tc.function.name, tc.function.arguments, tc.id);

                callbacks.onDone({
                    role: 'assistant',
                    content: content || null,
                    tool_calls: toolCalls.length ? toolCalls : undefined,
                });
                return;
            } catch (err) {
                if (emitted || attempt >= this.maxRetries) {
                    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
                    return;
                }
                await new Promise(r => setTimeout(r, Math.min(1000 * 2 ** attempt, 16000)));
            }
        }
    }
}
