export type AppMode = 'fast' | 'thinker' | 'pro';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  metadata?: any;
}

export interface UserCredits {
  data: {
    label: string;
    usage: number;
    limit: number | null;
    is_free_tier: boolean;
    rate_limit: {
      requests: number;
      interval: string;
    };
  };
}

export interface OpenRouterKeyInfo {
  data: {
    label: string;
    usage: number;
    limit: number | null;
    is_free_tier: boolean;
    rate_limit: {
      requests: number;
      interval: string;
    };
  };
}
