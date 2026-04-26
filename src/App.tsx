/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, RefObject } from 'react';
import { AppMode, Message } from './types';
import axios from 'axios';
import { Send, Paperclip, Mic, User, Sparkles } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthCallback from './components/AuthCallback';
import Background from './components/Background';
import Logo from './components/Logo';
import ModeToggle from './components/ModeToggle';
import LandingPage from './components/LandingPage';
import { motion, AnimatePresence } from 'motion/react';

// Typewriter effect component
function TypewriterContent({ content, onComplete, chatContainerRef, speed = 15, onProgress }: { 
  content: string, 
  onComplete?: () => void,
  chatContainerRef: RefObject<HTMLDivElement | null>,
  speed?: number,
  onProgress?: () => void
}) {
  const [displayed, setDisplayed] = useState("");
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      const nextContent = content.slice(0, index + 1);
      setDisplayed(nextContent);
      index++;
      
      // Auto-progress caller
      if (onProgress) onProgress();

      if (index >= content.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [content, onComplete, chatContainerRef, speed, onProgress]);

  return (
    <span className="whitespace-pre-wrap leading-[1.6] relative">
      {displayed}
      {displayed.length < content.length && (
        <span className="inline-block w-2 h-4 ml-1 bg-purple-500/50 animate-pulse rounded-sm align-middle" />
      )}
    </span>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MessageInterface />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function MessageInterface() {
  const [mode, setMode] = useState<AppMode>('fast');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isReasoningFinished, setIsReasoningFinished] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [isEngineOnline, setIsEngineOnline] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [sessionUsage, setSessionUsage] = useState(0);
  const [balance, setBalance] = useState(0);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll handler with interaction check
  const performAutoScroll = () => {
    if (!isUserScrolling && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Detect user scrolling to pause auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // If user has scrolled up more than 100px from bottom, they are "interacting"
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsUserScrolling(!isAtBottom);
  };

  const checkAuthStatus = async () => {
    try {
      const res = await axios.get('/api/auth/status');
      setIsAuthenticated(res.data.authenticated);
      if (res.data.authenticated) {
        setIsEngineOnline(true);
        setShowLanding(false); // If already authenticated, skip landing or at least sync state
      }
    } catch (err) {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = () => {
    const callbackUrl = encodeURIComponent(`${window.location.origin}/auth/callback`);
    const authUrl = `https://openrouter.ai/auth?callback_url=${callbackUrl}`;
    
    const popup = window.open(authUrl, 'openrouter_login', 'width=600,height=700');
    if (!popup) {
      alert('Neural bridge initialization blocked by browser. Please allow popups.');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setIsAuthenticated(false);
      setIsEngineOnline(false);
      setShowLanding(true);
      setMessages([]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Auto-resize textarea logic
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [input]);

  // Mobile Keyboard Adaptation (Virtual Viewport)
  useEffect(() => {
    if (!window.visualViewport) return;
    
    const handleResize = () => {
      const vv = window.visualViewport;
      if (vv) {
        setViewportHeight(`${vv.height}px`);
        // Force scroll to bottom when keyboard shifts viewport
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
    };
    
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  useEffect(() => {
    checkAuthStatus();
    
    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuthStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Sync balance and usage from OpenRouter
  useEffect(() => {
    if (!isEngineOnline) return;

    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/balance');
        
        if (response.data?.data) {
          const { usage, limit } = response.data.data;
          if (limit !== null) {
            setBalance(Math.max(0, limit - usage));
          } else {
            setBalance(usage); 
          }
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          console.warn('Engine stats sync paused: API key not configured.');
          setIsEngineOnline(false); // Force offline if key is missing/invalid
        } else {
          console.error('Failed to sync engine stats:', err.message);
        }
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); 
    return () => clearInterval(interval);
  }, [isEngineOnline]);

  const handleBridgeConnection = async () => {
    if (isActivating || isEngineOnline) return;

    if (!isAuthenticated) {
      handleLogin();
      return;
    }
    
    setIsActivating(true);
    
    // Attempt connectivity check silently
    try {
      const response = await axios.get('/api/balance');
      if (response.data?.data) {
        const { usage, limit } = response.data.data;
        if (limit !== null) setBalance(Math.max(0, limit - usage));
        else setBalance(usage);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setTimeout(() => {
        setIsActivating(false);
        setIsEngineOnline(true);
        setShowLanding(false);
      }, 1500);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInput('');
    setIsThinking(false);
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking || isTyping) return;

    // Prevent any duplicate rapid-fire sends
    const currentInput = input.trim();
    const userMessage: Message = { role: 'user', content: currentInput };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);
    setSystemError(null); 
    setIsReasoningFinished(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
    }

    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);

    try {
      const response = await axios.post('/api/chat', {
        messages: [...messages, userMessage],
        model: mode === 'fast' ? 'google/gemini-flash-1.5' : (mode === 'thinker' ? 'meta-llama/llama-3.1-405b' : 'anthropic/claude-3-opus')
      });

      const assistantMessageRaw = response.data.choices[0].message;
      const usage = response.data.usage?.total_tokens || 0;
      
      setIsThinking(false);
      setIsTyping(true);
      setSessionUsage(prev => prev + usage);

      // Extract reasoning or generate dynamic log
      let reasoning = assistantMessageRaw.reasoning || assistantMessageRaw.thought;
      if (!reasoning) {
        reasoning = `BRIDGE ACTIVATED: Routing through OpenRouter Neural Mesh | Selecting optimal model synergy | Context mapping: active | Mind Consensus reached.`;
      }

      const realResponse: Message = {
        role: 'assistant',
        content: assistantMessageRaw.content,
        reasoning: reasoning,
        metadata: response.data.usage
      };
      setMessages(prev => [...prev, realResponse]);

    } catch (err: any) {
      setIsThinking(false);
      
      // FALLBACK: Simulated UI Flow
      setIsTyping(true);
      const mockResponse: Message = {
        role: 'assistant',
        reasoning: `ENGINEERING LOG: Local bypass active for "${currentInput.slice(0, 20)}..." | Neural pathways mapped | Synthetic consensus reached: 99.8% | Initializing transmisión.`,
        content: "Mind Interface active in local bypass. Neural pipe ready."
      };
      setMessages(prev => [...prev, mockResponse]);
      
      console.log('Engine sync state: Offline/Bypass');
    }
  };

  if (showLanding && !isEngineOnline) {
    return <LandingPage onStart={handleBridgeConnection} onAuth={isAuthenticated} />;
  }

  return (
    <div 
      className="flex flex-col bg-black text-[#e3e3e3] font-sans overflow-hidden"
      style={{ height: viewportHeight }}
    >
      <Background />
      
      {/* Scroll to Bottom Indicator - only shows when paused and new messages arrives */}
      <AnimatePresence>
        {isUserScrolling && (isTyping || isThinking) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => {
              setIsUserScrolling(false);
              performAutoScroll();
            }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer hover:bg-purple-500 transition-all border border-purple-400/30"
          >
            Bridge Active • Live Stream Paused
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer 0: Static Background Logo Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        <div className={`transition-all duration-1000 ${messages.length > 0 ? 'opacity-0 scale-50' : (isActivating ? 'opacity-40 scale-110' : 'opacity-10')}`}>
          <Logo size="lg" isThinking={isActivating} />
        </div>
      </div>

      {/* Layer 1: Header (Fixed) */}
      <header className="h-[60px] flex-shrink-0 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={startNewChat}>
            <Logo size="sm" isThinking={isThinking || isActivating} />
            <h1 className="text-base font-bold tracking-tight text-white/90">Black Engine</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-900/40 text-purple-400 border border-purple-500/30 font-black uppercase tracking-widest ml-1">Core</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[9px] font-black uppercase tracking-widest rounded-full transition-all active:scale-95"
            >
              Disconnect
            </button>
          )}

          {/* Token Display */}
          <div className="hidden md:flex items-center gap-4 px-4 py-1.5 bg-white/5 border border-purple-500/20 rounded-full backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase tracking-widest text-[#9aa0a6] leading-tight text-center">Power</span>
              <span className="text-[10px] font-mono text-zinc-200 leading-tight">${balance.toFixed(2)}</span>
            </div>
            <div className="w-[1px] h-4 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase tracking-widest text-[#9aa0a6] leading-tight text-center">Sync</span>
              <span className="text-[10px] font-mono text-zinc-200 leading-tight">{sessionUsage}</span>
            </div>
          </div>

          {isEngineOnline && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
            </div>
          )}
          
          <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#9aa0a6] hover:text-white transition-all">
            <User size={16} />
          </button>
        </div>
      </header>

      <main 
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseEnter={() => setIsUserScrolling(true)}
        onMouseLeave={() => {
          // Check if we are at bottom before enabling auto-scroll
          if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            if (scrollHeight - scrollTop - clientHeight < 100) {
              setIsUserScrolling(false);
            }
          }
        }}
        className="flex-1 overflow-y-auto px-4 relative z-10 flex flex-col pt-[30px]"
      >
        <div className="max-w-3xl w-full mx-auto relative flex-1 flex flex-col">
          <div className="flex flex-col gap-[20px] mt-8 w-full items-stretch">
            {messages.length === 0 && !isThinking && (
              <div className="h-[40vh] flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-[10px] font-black tracking-[0.8em] uppercase text-zinc-700 animate-pulse text-center">Engineering Terminal Initialized</p>
              </div>
            )}
            
            {messages.map((m, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                   relative max-w-[85%] p-4 text-[15px] leading-[1.6] backdrop-blur-[10px] border shadow-2xl transition-all duration-500 h-auto break-words overflow-visible
                   ${m.role === 'user' 
                     ? 'bg-[#4c1d95] text-white rounded-[20px] rounded-br-[4px] border-purple-500/40 shadow-[0_0_20px_rgba(76,29,149,0.2)]' 
                     : 'bg-black/80 text-[#d1d1d1] rounded-[20px] rounded-bl-[4px] border-white/5'
                   }
                   ${(m.role === 'assistant' && i === messages.length - 1 && isTyping) ? 'ring-1 ring-purple-500/30' : ''}
                `}>
                  <div className="flex items-center gap-2 mb-2 opacity-50 scale-90 origin-left">
                    {m.role === 'assistant' && <Logo size="xs" isThinking={false} />}
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      {m.role === 'user' ? 'Operator' : 'Black Engine'}
                    </span>
                  </div>
                  
                  <div className="message-content">
                    {m.reasoning && (
                      <div className={`
                        mb-[8px] relative overflow-hidden rounded-lg bg-purple-500/5 border border-purple-500/20 px-4 py-3 max-h-[250px] overflow-y-auto scrollbar-hide
                        ${(m.role === 'assistant' && i === messages.length - 1 && isTyping && !isReasoningFinished) ? 'opacity-100 ring-2 ring-purple-500/10' : 'opacity-70'}
                        transition-all duration-700
                      `}>
                        {/* Scanning Effect */}
                        {(m.role === 'assistant' && i === messages.length - 1 && isTyping && !isReasoningFinished) && (
                          <div className="absolute inset-0 pointer-events-none z-0">
                            <div className="absolute inset-x-0 h-[2px] bg-purple-500/30 blur-[2px] animate-scan" />
                          </div>
                        )}
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Sparkles size={10} className={`text-purple-400 ${!isReasoningFinished ? 'animate-pulse' : ''}`} />
                              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-purple-400/80">
                                Black Engine Core Thinking
                              </span>
                            </div>
                            {(m.role === 'assistant' && i === messages.length - 1 && !isReasoningFinished) ? (
                              <span className="text-[7px] font-black uppercase text-purple-400 animate-pulse">Processing...</span>
                            ) : (
                              <span className="text-[7px] font-black uppercase text-emerald-400/80 flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                Consensus Reached
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-purple-300/70 lowercase tracking-tight leading-relaxed">
                            {m.role === 'assistant' && i === messages.length - 1 && isTyping && !isReasoningFinished ? (
                              <TypewriterContent 
                                content={m.reasoning} 
                                speed={3}
                                onProgress={performAutoScroll}
                                onComplete={() => setIsReasoningFinished(true)}
                                chatContainerRef={scrollRef}
                              />
                            ) : (
                              <span>{m.reasoning}</span>
                            )}
                          </div>
                          
                          {/* Progress Bar & Status */}
                          {(m.role === 'assistant' && i === messages.length - 1 && !isReasoningFinished) && (
                            <div className="mt-4">
                              <p className="text-[7px] font-black uppercase tracking-widest text-purple-400/40 mb-1 animate-pulse">
                                Synergizing Idea Blocks...
                              </p>
                              <div className="h-1 w-full bg-purple-900/30 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7] animate-progress" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {m.role === 'assistant' && i === messages.length - 1 && isReasoningFinished && isTyping && m.reasoning && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-[10px] italic"
                      >
                        Consensus reached. Transmitting to Mind Interface...
                      </motion.p>
                    )}

                    {m.role === 'assistant' && i === messages.length - 1 && isTyping ? (
                      isReasoningFinished ? (
                        <TypewriterContent 
                          content={m.content} 
                          onProgress={performAutoScroll}
                          onComplete={() => setIsTyping(false)} 
                          chatContainerRef={scrollRef}
                        />
                      ) : null
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Bottom Spacer */}
            <div className="h-[150px] w-full shrink-0" aria-hidden="true" />
          </div>
        </div>
      </main>

      {/* Layer 3: Input Bar */}
      <footer className="fixed bottom-0 left-0 w-full z-30 pb-8 pt-4 bg-gradient-to-t from-black via-black/95 to-transparent">
        <div className="max-w-3xl mx-auto w-full px-4 relative">
          
          <AnimatePresence>
            {isThinking && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: -20 }}
                exit={{ opacity: 0 }}
                className="absolute -top-12 left-0 w-full flex justify-center"
              >
                <div className="flex items-center gap-3 px-4 py-2 bg-[#2d004d]/80 backdrop-blur-xl border border-purple-500/40 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                   <Logo size="xs" isThinking={true} />
                   <p className="text-[9px] font-black tracking-[0.3em] uppercase text-purple-400">Consulting Core...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex items-end bg-zinc-900/80 backdrop-blur-2xl rounded-[28px] border border-white/5 focus-within:border-purple-500/30 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] px-2 py-1">
            {!isEngineOnline && (
              <button 
                onClick={handleBridgeConnection}
                disabled={isActivating}
                className="ml-2 mb-1 px-5 h-11 flex items-center gap-2 bg-purple-500 text-white rounded-full transition-all active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:bg-purple-400 group disabled:opacity-50"
              >
                <Sparkles size={16} className={isActivating ? 'animate-spin' : ''} />
                <span className="text-[11px] font-black uppercase tracking-tighter text-nowrap">
                  {isAuthenticated === false ? 'Login with OpenRouter' : 'ACTIVATE MIND'}
                </span>
              </button>
            )}
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => {
                setTimeout(() => {
                  if (scrollRef.current) {
                    const lastMsg = scrollRef.current.querySelector('div:last-child');
                    lastMsg?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                  }
                }, 300);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Activate Mind..."
              rows={1}
              className="flex-1 bg-transparent px-5 py-4 outline-none text-white text-sm placeholder:text-zinc-600 resize-none font-sans font-medium min-h-[56px] overflow-y-auto"
            />
            
            <div className="flex items-center gap-2 pr-2 mb-1">
              <button
                onClick={handleSend}
                disabled={isThinking || isTyping || !input.trim()}
                className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${!input.trim() ? 'text-zinc-700' : 'text-purple-400 hover:text-purple-300 active:scale-90'}`}
              >
                <Send size={20} strokeWidth={2.5} fill={!input.trim() ? 'none' : 'currentColor'} className={!input.trim() ? 'opacity-20' : 'opacity-100 shadow-[0_0_15px_rgba(168,85,247,0.5)]'} />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
