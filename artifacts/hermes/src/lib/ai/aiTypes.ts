import { Message, AIProviderConfig } from '../../types';

export interface AIClientOptions {
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
  onChunk?: (text: string) => void;
}

export interface AIClientResponse {
  text: string;
  error?: string;
  latencyMs?: number;
}
