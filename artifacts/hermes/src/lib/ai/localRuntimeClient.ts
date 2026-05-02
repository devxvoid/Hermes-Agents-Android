import { AIProviderConfig } from '../../types';

export async function testLocalRuntimeConnection(config: AIProviderConfig): Promise<{success: boolean; message: string; latencyMs: number}> {
  const start = Date.now();
  try {
    const base = config.baseUrl.replace(/\/$/, '');
    const isOllama = base.includes('11434') || base.endsWith('/api');
    const testUrl = isOllama ? `${base}/api/tags` : `${base}/v1/models`;
    const response = await fetch(testUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    if (!response.ok) return { success: false, message: `Server responded with ${response.status}`, latencyMs };
    return { success: true, message: 'Local runtime reachable', latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    if (err.name === 'TimeoutError') return { success: false, message: 'Local AI runtime is not reachable. Start Ollama, LM Studio, GPT4All, vLLM, llama.cpp, or MLC LLM, then test again.', latencyMs };
    return { success: false, message: 'Local AI runtime is not reachable. Start Ollama, LM Studio, GPT4All, vLLM, llama.cpp, or MLC LLM, then test again.', latencyMs };
  }
}

export async function sendLocalRuntimeMessage(messages: {role: string; content: string}[], systemPrompt: string, config: AIProviderConfig, options: {temperature?: number; maxTokens?: number} = {}): Promise<string> {
  const base = config.baseUrl.replace(/\/$/, '');
  const isOllamaNative = base.includes('11434') && !base.includes('/v1');

  if (isOllamaNative) {
    const payload = {
      model: config.selectedModel,
      messages: systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages,
      stream: false,
    };
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) throw new Error(`Ollama error (${response.status}). Is the model downloaded?`);
    const data = await response.json();
    return data.message?.content || '';
  }

  const payload = {
    model: config.selectedModel,
    messages: systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
    stream: false,
  };
  const response = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`Local runtime error (${response.status}). Check if the model is loaded.`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function fetchLocalModels(config: AIProviderConfig): Promise<string[]> {
  try {
    const base = config.baseUrl.replace(/\/$/, '');
    const isOllama = base.includes('11434') && !base.includes('/v1');
    const url = isOllama ? `${base}/api/tags` : `${base}/v1/models`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return [];
    const data = await response.json();
    if (isOllama) return (data.models || []).map((m: any) => m.name).filter(Boolean);
    return (data.data || []).map((m: any) => m.id).filter(Boolean);
  } catch {
    return [];
  }
}
