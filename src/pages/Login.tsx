import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, user, loading, error } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  if (loading) return null;
  if (user) return <Navigate to={from} replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="overflow-hidden rounded-3xl bg-[#1e293b] p-8 shadow-2xl shadow-blue-500/10 border border-[#334155]">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#3b82f6] text-3xl font-bold text-white shadow-xl shadow-blue-500/20">
              BU
            </div>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-[#f8fafc]">
                ระบบลงทะเบียนอบรม
              </h1>
              <p className="mt-2 text-[#94a3b8]">
                Bangkok University Training System
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-full items-center space-x-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <button
              onClick={() => login()}
              className="flex w-full items-center justify-center space-x-3 rounded-2xl bg-[#f8fafc] px-6 py-4 font-semibold text-[#0f172a] transition-all hover:bg-white hover:shadow-lg active:scale-[0.98]"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg"
                alt="Google"
                className="h-5 w-5"
              />
              <span>Login with Google Account</span>
            </button>

            <p className="text-[11px] uppercase tracking-widest text-[#64748b] font-bold">
              เฉพาะอีเมล @bu.ac.th เท่านั้น
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
