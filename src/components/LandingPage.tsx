import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageCircle } from 'lucide-react';

const SHOW_MESSAGES = [
  { sender: "المستخدم", content: "ما رأيك في فكرة تحالف النماذج لمساعدة المستخدم؟", delay: 2000 },
  { sender: "GEMINI", content: "فكرة بلاك انجن هي عقل جماعي يصحح أخطاء الآخر للوصول لأدق إجابة ممكنة...", delay: 4000 },
  { sender: "ChatGPT", content: "قوية لأنها تعتمد على مبدأ 'تصحيح ذاتي جماعي' يقلل الأخطاء...", delay: 4000 },
  { sender: "GROK", content: "مثيرة ومنطقية كخطوة تطورية، تحول التنافس لتعاون تصحيحي...", delay: 4000 },
  { sender: "CLAUDE", content: "واعدة إذا اقترنت بتنويع حقيقي في مصادر التدريب والمنهجيات...", delay: 4000 },
  { sender: "النتيجة (إجماع المحرك)", content: "تم التوصل إلى توافق: التحالف يمثل قفزة نوعية في دقة الذكاء الاصطناعي...", delay: 5000 },
];

export default function LandingPage({ onStart, onAuth }: { onStart: () => void, onAuth: boolean | null }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % SHOW_MESSAGES.length);
    }, (SHOW_MESSAGES[currentStep]?.delay || 3000));
    return () => clearInterval(timer);
  }, [currentStep]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 z-[100] overflow-hidden">
      {/* Background Neural Animation Feel */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/40 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="max-w-2xl w-full flex flex-col items-center gap-12 relative z-10">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <Sparkles className="text-purple-500 w-8 h-8 animate-pulse" />
            <h1 className="text-3xl font-black tracking-widest text-white uppercase italic">Black Engine</h1>
          </motion.div>
          <p className="text-[10px] font-black tracking-[0.5em] text-purple-400 uppercase italic animate-pulse">
            Neural Alliance Protocol Active
          </p>
        </div>

        {/* Live Presentation Area */}
        <div className="w-full aspect-video bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.1)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col justify-center gap-6"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${currentStep === 0 ? 'text-zinc-500' : 'text-purple-400'}`}>
                    {SHOW_MESSAGES[currentStep].sender}
                  </span>
                  {currentStep > 0 && currentStep < SHOW_MESSAGES.length - 1 && (
                    <div className="flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-purple-500 animate-ping" />
                      <div className="w-1 h-1 rounded-full bg-purple-500 animate-ping delay-75" />
                    </div>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white/90 leading-relaxed text-right dir-rtl">
                  {SHOW_MESSAGES[currentStep].content}
                </h2>
              </div>

              {/* Loading Bar Effect */}
              {currentStep > 0 && (
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: (SHOW_MESSAGES[currentStep].delay / 1000) - 0.5 }}
                    className="h-full bg-purple-600 shadow-[0_0_15px_#a855f7]"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          
          {/* Scanning Line Effect */}
          <div className="absolute inset-x-0 h-px bg-purple-500/30 blur-sm animate-scan pointer-events-none" />
        </div>

        {/* Conversion Gate Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
          <button
            onClick={onStart}
            className="flex-1 px-8 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest text-[12px] transition-all active:scale-95 shadow-[0_0_40px_rgba(168,85,247,0.3)] border border-purple-400/50 flex items-center justify-center gap-3 group"
          >
            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            {onAuth ? "Activate Alliance" : "Start Alliance Sync"}
          </button>
          
          <a
            href="https://t.me/your_bot_link" 
            target="_blank"
            rel="noreferrer"
            className="flex-1 px-8 py-5 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[12px] transition-all active:scale-95 flex items-center justify-center gap-3 group"
          >
            <MessageCircle className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            Go to Telegram Bot
          </a>
        </div>

        <div className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 italic">
          Synergy Core v3.0 // Authorized Personnel Only
        </div>
      </div>
    </div>
  );
}
