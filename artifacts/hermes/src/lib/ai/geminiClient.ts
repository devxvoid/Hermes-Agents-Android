import { AIProviderConfig } from '../../types';

export async function testGeminiConnection(config: AIProviderConfig): Promise<{success: boolean; message: string; latencyMs: number}> {
  const start = Date.now();
  try {
    const model = config.selectedModel || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] }),
      signal: AbortSignal.timeout(10000),
    });
    const latencyMs = Date.now() - start;
    if (response.status === 400) {
      const data = await response.json().catch(() => ({}));
      if (data?.error?.message?.includes('API_KEY')) return { success: false, message: 'Invalid API key', latencyMs };
    }
    if (response.status === 429) return { success: false, message: 'Rate limited', latencyMs };
    if (!response.ok) return { success: false, message: `HTTP ${response.status}`, latencyMs };
    return { success: true, message: 'Connected', latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    if (err.name === 'TimeoutError') return { success: false, message: 'Connection timed out', latencyMs };
    return { success: false, message: err.message || 'Connection failed', latencyMs };
  }
}

export async function sendGeminiMessage(messages: {role: string; content: string}[], systemPrompt: string, config: AIProviderConfig, options: {temperature?: number; maxTokens?: number} = {}): Promise<string> {
  const model = config.selectedModel || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body: any = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 2048,
    },
  };
  if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    if (response.status === 400) throw new Error('Invalid Gemini API key or request.');
    if (response.status === 429) throw new Error('Gemini rate limit reached.');
    throw new Error(`Gemini error (${response.status})`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function sendGeminiMessageStream(
  messages: {role: string; content: string}[],
  systemPrompt: string,
  config: AIProviderConfig,
  options: {temperature?: number; maxTokens?: number} = {},
  onChunk: (chunk: string) => void,
): Promise<string> {
  const model = config.selectedModel || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${config.apiKey}`;

  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body: any = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 2048,
    },
  };
  if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    if (response.status === 400) throw new Error('Invalid Gemini API key or request.');
    if (response.status === 429) throw new Error('Gemini rate limit reached.');
    throw new Error(`Gemini error (${response.status})`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      try {
        const parsed = JSON.parse(data);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) { fullText += text; onChunk(text); }
      } catch {}
    }
  }

  return fullText;
}
