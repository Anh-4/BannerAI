import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { LoginScreen } from './components/LoginScreen';

/** Chặn cổng: chưa đăng nhập -> hiện LoginScreen; đã đăng nhập -> hiện app. */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0e0e0e]">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/70 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <LoginScreen />;
  return <>{children}</>;
};
