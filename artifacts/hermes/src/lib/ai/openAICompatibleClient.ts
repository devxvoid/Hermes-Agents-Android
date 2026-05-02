import { AIProviderConfig } from '../../types';

export async function testOpenAICompatibleConnection(config: AIProviderConfig): Promise<{success: boolean; message: string; latencyMs: number}> {
  const start = Date.now();
  try {
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    const latencyMs = Date.now() - start;
    if (response.status === 401) return { success: false, message: 'Invalid API key', latencyMs };
    if (response.status === 429) return { success: false, message: 'Rate limited', latencyMs };
    if (!response.ok) return { success: false, message: `HTTP ${response.status}`, latencyMs };
    return { success: true, message: 'Connected', latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    if (err.name === 'TimeoutError') return { success: false, message: 'Connection timed out', latencyMs };
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      return { success: false, message: 'Network error — check URL and internet connection', latencyMs };
    }
    return { success: false, message: err.message || 'Connection failed', latencyMs };
  }
}

export async function sendOpenAICompatibleMessage(messages: {role: string; content: string}[], systemPrompt: string, config: AIProviderConfig, options: {temperature?: number; maxTokens?: number} = {}): Promise<string> {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const body: any = {
    model: config.selectedModel,
    messages: systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
    stream: false,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    if (response.status === 401) throw new Error('Invalid API key. Please check your credentials in AI Models.');
    if (response.status === 429) throw new Error('Rate limit reached. Please wait and try again.');
    if (response.status === 404) throw new Error(`Model "${config.selectedModel}" not found. Check the model name.`);
    throw new Error(`Provider error (${response.status}): ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function fetchOpenAIModels(config: AIProviderConfig): Promise<string[]> {
  try {
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${config.apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.data || []).map((m: any) => m.id).filter(Boolean);
  } catch {
    return [];
  }
}
