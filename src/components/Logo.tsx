import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Settings } from 'lucide-react';

interface LogoProps {
  isThinking?: boolean;
}

export default function Logo({ isThinking = false, size = "md" }: { isThinking?: boolean, size?: "xs" | "sm" | "md" | "lg" }) {
  const sizes = {
    xs: { box: 12, gearTop: 8, gearBottom: 10, container: "w-6 h-6" },
    sm: { box: 16, gearTop: 12, gearBottom: 14, container: "w-10 h-10" },
    md: { box: 24, gearTop: 18, gearBottom: 22, container: "w-16 h-16" },
    lg: { box: 44, gearTop: 32, gearBottom: 36, container: "w-32 h-32" }
  };
  const s = sizes[size];

  return (
    <div className={`relative flex items-center justify-center transition-all duration-1000 ${isThinking ? 'scale-125' : 'scale-110'} ${s.container}`}>
      {/* Permanent Static Subtle Glow */}
      <div className="absolute inset-0 bg-purple-500/5 rounded-full blur-[20px] -z-10" />
      
      {/* Active Thinking Pulse Glow */}
      <AnimatePresence>
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.1, 0.5, 0.1], scale: [1, 1.3, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-purple-600/30 rounded-full blur-[50px] -z-10"
          />
        )}
      </AnimatePresence>

      {/* Central Cube - Glows subtly when thinking or static */}
      <motion.div
        animate={{
          scale: isThinking ? [1, 1.15, 1] : 1,
          rotateY: isThinking ? [0, 180, 360] : 0,
          filter: isThinking 
            ? "drop-shadow(0 0 15px #8a2be2)" 
            : "drop-shadow(0 0 5px rgba(168,85,247,0.3))",
        }}
        transition={{
          duration: isThinking ? 2 : 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="z-10 text-purple-500"
      >
        <Box size={s.box} />
      </motion.div>

      {/* Top Gear - Rotates only when thinking */}
      <motion.div
        animate={isThinking ? { rotate: 360 } : { rotate: 0 }}
        transition={{
          duration: 3,
          repeat: isThinking ? Infinity : 0,
          ease: "linear",
        }}
        className="absolute top-0 right-0 text-zinc-600/30"
      >
        <Settings size={s.gearTop} />
      </motion.div>

      {/* Bottom Gear - Rotates only when thinking */}
      <motion.div
        animate={isThinking ? { rotate: -360 } : { rotate: 0 }}
        transition={{
          duration: 4,
          repeat: isThinking ? Infinity : 0,
          ease: "linear",
        }}
        className="absolute bottom-0 left-0 text-zinc-600/30"
      >
        <Settings size={s.gearBottom} />
      </motion.div>
    </div>
  );
}
