import { Coins } from 'lucide-react';
import { OpenRouterKeyInfo } from '../types';

interface TokenCounterProps {
  balance: OpenRouterKeyInfo | null;
}

export default function TokenCounter({ balance }: TokenCounterProps) {
  if (!balance) return null;

  // Usage is in USD for OpenRouter key info
  const usage = balance.data.usage;
  const limit = balance.data.limit;

  return (
    <div className="fixed top-6 right-6 flex items-center gap-2 px-4 py-2 bg-zinc-900/40 border border-zinc-800 rounded-full backdrop-blur-md z-50">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <Coins size={14} className="text-zinc-400" />
      <span className="text-xs font-mono text-zinc-300">
        Usage: <span className="text-white">${usage.toFixed(4)}</span>
        {limit && <span className="text-zinc-500"> / ${limit.toFixed(2)}</span>}
      </span>
    </div>
  );
}
