import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const processAuth = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      const key = searchParams.get('key');
      
      const authValue = code || key;

      if (!authValue) {
        setStatus('error');
        setErrorMsg('Unauthorized: No code or key found in callback URL.');
        return;
      }

      try {
        await axios.post('/api/auth/callback', { code, key });
        setStatus('success');
        
        // Notify opener if exists (for popup flow)
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
          setTimeout(() => window.close(), 1500);
        } else {
          // Direct navigation
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (err: any) {
        console.error('Auth processing failed:', err);
        setStatus('error');
        setErrorMsg(err.response?.data?.error || 'Failed to sync neural bridge.');
      }
    };

    processAuth();
  }, [location, navigate]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 z-[200]">
      <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-3xl border border-white/5 rounded-3xl p-10 text-center space-y-6">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex justify-center"
        >
          <Sparkles className="w-12 h-12 text-purple-500" />
        </motion.div>

        {status === 'processing' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white uppercase tracking-widest">Syncing Neural Bridge</h2>
            <p className="text-sm text-zinc-500">Establishing secure connection with OpenRouter...</p>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                className="h-full bg-purple-600 shadow-[0_0_15px_#a855f7]"
              />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-emerald-400 uppercase tracking-widest">Bridge Synchronized</h2>
            <p className="text-sm text-zinc-400 italic">Neural pathways mapped successfully. Protocol active.</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Returning to system...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-red-400 uppercase tracking-widest">Bridge Failure</h2>
            <p className="text-sm text-zinc-400">{errorMsg}</p>
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white transition-all"
            >
              Back to Interface
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
