import React, { useState } from 'react';
import { supabase } from '../supabase';
import { PillButton } from './Primitives';

// Dịch lỗi Supabase Auth sang tiếng Việt cho dễ hiểu.
function mapError(msg?: string): string {
  const m = (msg || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'Sai email hoặc mật khẩu.';
  if (m.includes('email not confirmed')) return 'Email chưa được xác nhận.';
  if (m.includes('rate') || m.includes('too many')) return 'Thử quá nhiều lần, đợi chút rồi thử lại.';
  if (m.includes('network') || m.includes('failed to fetch')) return 'Lỗi mạng — kiểm tra kết nối.';
  return msg || 'Đăng nhập thất bại. Thử lại.';
}

/** Màn hình đăng nhập toàn trang — chặn app cho tới khi đăng nhập thành công. */
export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email.trim() || !password) {
      setError('Nhập đủ email và mật khẩu.');
      return;
    }
    setError(''); setInfo(''); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) setError(mapError(error.message));
      // Thành công -> AuthGate (onAuthStateChange) tự chuyển sang app.
    } catch (e: any) {
      setError(mapError(e?.message));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) { setError('Nhập email trước khi đặt lại mật khẩu.'); return; }
    setError(''); setInfo('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) setError(mapError(error.message));
    else setInfo('Đã gửi email đặt lại mật khẩu (kiểm tra hộp thư).');
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0e0e0e] text-white select-none">
      <div className="w-full max-w-[360px] flex flex-col gap-5 px-8">
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[34px] text-amber-400">auto_awesome</span>
          <h1 className="text-[18px] font-semibold">Banner AI</h1>
          <p className="text-[11px] text-white/40">Đăng nhập để tiếp tục</p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="Email"
            autoFocus
            className="w-full border border-[#595959] focus:border-amber-400 rounded-xl px-3 py-2.5 bg-transparent text-[12px] text-white placeholder-white/25 focus:outline-none transition-colors"
          />
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              placeholder="Mật khẩu"
              className="w-full border border-[#595959] focus:border-amber-400 rounded-xl px-3 py-2.5 pr-10 bg-transparent text-[12px] text-white placeholder-white/25 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">
                {show ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {error && <p className="text-[11px] text-red-400 -mt-1">{error}</p>}
        {info && <p className="text-[11px] text-emerald-400 -mt-1">{info}</p>}

        <PillButton variant="solid" onClick={login} disabled={loading} className="w-full py-2.5">
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </PillButton>

        <button
          onClick={resetPassword}
          className="text-[10px] text-white/40 hover:text-white transition-colors"
        >
          Quên mật khẩu?
        </button>
      </div>
    </div>
  );
};
