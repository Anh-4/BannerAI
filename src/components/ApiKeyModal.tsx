import React, { useEffect, useState } from 'react';
import { PillButton } from './Primitives';

/** Popup nhập/đổi Google Gemini API key. Key lưu localStorage trên máy người dùng. */
export const ApiKeyModal: React.FC<{
  isOpen: boolean;
  currentKey: string;
  required: boolean; // chưa có key -> bắt buộc nhập, không cho đóng
  onSave: (key: string) => void;
  onClose: () => void;
}> = ({ isOpen, currentKey, required, onSave, onClose }) => {
  const [val, setVal] = useState(currentKey);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) setVal(currentKey);
  }, [isOpen, currentKey]);

  if (!isOpen) return null;

  const canClose = !required;

  const save = () => {
    const k = val.trim();
    if (!k) return;
    onSave(k);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-6"
      onClick={() => canClose && onClose()}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div
        className="relative w-full max-w-[420px] bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-amber-400">key</span>
          <h2 className="text-[15px] font-semibold text-white">Google Gemini API Key</h2>
        </div>

        <p className="text-[11px] text-white/50 leading-relaxed">
          App dùng key của bạn để tạo ảnh. Lấy key miễn phí tại{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 underline"
          >
            aistudio.google.com/apikey
          </a>
          . Key chỉ lưu trên máy bạn.
        </p>

        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="Dán API key vào đây..."
            autoFocus
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

        <div className="flex items-center justify-end gap-2 pt-1">
          {canClose && (
            <PillButton variant="outline" onClick={onClose}>
              Đóng
            </PillButton>
          )}
          <PillButton variant="solid" onClick={save}>
            Lưu &amp; dùng
          </PillButton>
        </div>
      </div>
    </div>
  );
};
