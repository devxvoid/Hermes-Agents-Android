import { AIProviderConfig } from '../../types';

export async function testAnthropicConnection(config: AIProviderConfig): Promise<{success: boolean; message: string; latencyMs: number}> {
  const start = Date.now();
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey || '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: config.selectedModel || 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }],
      }),
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
    return { success: false, message: err.message || 'Connection failed', latencyMs };
  }
}

export async function sendAnthropicMessage(messages: {role: string; content: string}[], systemPrompt: string, config: AIProviderConfig, options: {temperature?: number; maxTokens?: number} = {}): Promise<string> {
  const body: any = {
    model: config.selectedModel,
    max_tokens: options.maxTokens ?? 2048,
    messages: messages.filter(m => m.role !== 'system'),
  };
  if (systemPrompt) body.system = systemPrompt;
  if (options.temperature !== undefined) body.temperature = options.temperature;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey || '',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Invalid Anthropic API key.');
    if (response.status === 429) throw new Error('Anthropic rate limit reached.');
    throw new Error(`Anthropic error (${response.status})`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}
