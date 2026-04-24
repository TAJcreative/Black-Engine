import { AppMode } from '../types';
import { Zap, Brain, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface ModeToggleProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

export default function ModeToggle({ mode, setMode }: ModeToggleProps) {
  const modes: { id: AppMode; label: string; icon: any; disabled?: boolean }[] = [
    { id: 'fast', label: 'Fast Mode', icon: Zap },
    { id: 'thinker', label: 'Thinker Mode', icon: Brain },
    { id: 'pro', label: 'Pro Mode', icon: Lock, disabled: true },
  ];

  return (
    <div className="flex gap-1 p-1 bg-[#1e1f20] rounded-full border border-[#3c4043]/30 backdrop-blur-sm">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.id;

        return (
          <button
            key={m.id}
            onClick={() => !m.disabled && setMode(m.id)}
            disabled={m.disabled}
            className={`
              relative flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all
              ${m.disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
              ${isActive ? 'text-white' : 'text-[#9aa0a6] hover:text-[#e3e3e3]'}
            `}
          >
            {isActive && (
              <motion.div
                layoutId="active-mode"
                className="absolute inset-0 bg-[#3c4043] rounded-full shadow-sm"
                transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
              />
            )}
            <Icon size={14} className={`relative z-10 ${isActive ? 'text-purple-400' : ''}`} />
            <span className="relative z-10">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
