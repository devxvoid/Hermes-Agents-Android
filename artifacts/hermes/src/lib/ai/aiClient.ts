import { AIProviderConfig } from '../../types';
import { testOpenAICompatibleConnection, sendOpenAICompatibleMessage, fetchOpenAIModels } from './openAICompatibleClient';
import { testAnthropicConnection, sendAnthropicMessage } from './anthropicClient';
import { testGeminiConnection, sendGeminiMessage } from './geminiClient';
import { testLocalRuntimeConnection, sendLocalRuntimeMessage, fetchLocalModels } from './localRuntimeClient';

export async function testProviderConnection(config: AIProviderConfig): Promise<{success: boolean; message: string; latencyMs: number}> {
  try {
    switch (config.type) {
      case "openai-compatible":
      case "custom-rest":
        return await testOpenAICompatibleConnection(config);
      case "anthropic":
        return await testAnthropicConnection(config);
      case "gemini":
        return await testGeminiConnection(config);
      case "local-openai-compatible":
        return await testLocalRuntimeConnection(config);
      default:
        return { success: false, message: "Unknown provider type", latencyMs: 0 };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Connection failed", latencyMs: 0 };
  }
}

export async function sendAIMessage(messages: any[], systemPrompt: string, config: AIProviderConfig, options: any = {}): Promise<string> {
  switch (config.type) {
    case "openai-compatible":
    case "custom-rest":
      return await sendOpenAICompatibleMessage(messages, systemPrompt, config, options);
    case "anthropic":
      return await sendAnthropicMessage(messages, systemPrompt, config, options);
    case "gemini":
      return await sendGeminiMessage(messages, systemPrompt, config, options);
    case "local-openai-compatible":
      return await sendLocalRuntimeMessage(messages, systemPrompt, config, options);
    default:
      throw new Error("Unknown provider type");
  }
}

export async function fetchProviderModels(config: AIProviderConfig): Promise<string[]> {
  if (config.type === "local-openai-compatible") {
    return await fetchLocalModels(config);
  } else if (config.type === "openai-compatible") {
    return await fetchOpenAIModels(config);
  }
  return [];
}
