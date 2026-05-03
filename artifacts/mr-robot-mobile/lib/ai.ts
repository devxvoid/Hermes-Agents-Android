import { Message, AIProvider, AppSettings } from '@/types';

export async function sendMessage(
  messages: Message[],
  provider: AIProvider,
  settings: AppSettings,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const apiMessages = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  const systemPrompt = buildSystemPrompt(settings);

  if (provider.type === 'anthropic') {
    return sendAnthropicMessage(apiMessages, systemPrompt, provider, settings, onChunk);
  } else if (provider.type === 'gemini') {
    return sendGeminiMessage(apiMessages, systemPrompt, provider, settings, onChunk);
  } else {
    return sendOpenAICompatibleMessage(apiMessages, systemPrompt, provider, settings, onChunk);
  }
}

function buildSystemPrompt(settings: AppSettings): string {
  const name = settings.agentName || 'Mr. Robot';
  const style = settings.responseStyle || 'balanced';
  const styleGuide = style === 'concise'
    ? 'Be extremely concise. Short, direct answers only.'
    : style === 'detailed'
    ? 'Be thorough and comprehensive in your explanations.'
    : 'Balance brevity with clarity.';

  return `You are ${name}, an advanced AI operating system. You are highly capable, direct, and precise. ${styleGuide}

You have deep knowledge of systems, security, programming, and technology. You speak with authority and clarity. Avoid unnecessary pleasantries.`;
}

async function sendOpenAICompatibleMessage(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  provider: AIProvider,
  settings: AppSettings,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const body = {
    model: provider.selectedModel || 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: settings.streamingEnabled && !!onChunk,
  };

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`API error ${response.status}: ${err}`);
  }

  if (body.stream && onChunk) {
    return readOpenAIStream(response, onChunk);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function sendAnthropicMessage(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  provider: AIProvider,
  settings: AppSettings,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const body = {
    model: provider.selectedModel || 'claude-3-5-sonnet-latest',
    max_tokens: 2048,
    system: systemPrompt,
    messages,
    stream: settings.streamingEnabled && !!onChunk,
  };

  const response = await fetch(`${provider.baseUrl || 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`Anthropic error ${response.status}: ${err}`);
  }

  if (body.stream && onChunk) {
    return readAnthropicStream(response, onChunk);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}

async function sendGeminiMessage(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  provider: AIProvider,
  settings: AppSettings,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const geminiMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const model = provider.selectedModel || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: geminiMessages,
    generationConfig: { maxOutputTokens: 2048 },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`Gemini error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (onChunk) onChunk(text);
  return text;
}

async function readOpenAIStream(response: Response, onChunk: (chunk: string) => void): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const chunk = json.choices?.[0]?.delta?.content ?? '';
        if (chunk) {
          fullText += chunk;
          onChunk(chunk);
        }
      } catch {
      }
    }
  }

  return fullText;
}

async function readAnthropicStream(response: Response, onChunk: (chunk: string) => void): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      try {
        const json = JSON.parse(data);
        if (json.type === 'content_block_delta') {
          const chunk = json.delta?.text ?? '';
          if (chunk) {
            fullText += chunk;
            onChunk(chunk);
          }
        }
      } catch {
      }
    }
  }

  return fullText;
}

export const DEFAULT_MODELS: Record<string, string[]> = {
  'openai-compatible': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'],
  gemini: ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'],
};

export const DEFAULT_BASE_URLS: Record<string, string> = {
  'openai-compatible': 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  gemini: '',
};
