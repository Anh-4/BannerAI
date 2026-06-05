import React, { useEffect, useState } from 'react';

type UpdateState =
  | { state: 'idle' }
  | { state: 'dev' }
  | { state: 'checking' }
  | { state: 'available'; version?: string }
  | { state: 'none'; version?: string }
  | { state: 'downloading'; percent?: number }
  | { state: 'downloaded'; version?: string }
  | { state: 'error'; message?: string };

/** Nút kiểm tra cập nhật thủ công + hiển thị phiên bản. Chỉ hiện khi chạy trong app Electron. */
export const UpdateButton: React.FC = () => {
  const updater = (window as any).updater as
    | {
        check: () => Promise<any>;
        quitAndInstall: () => Promise<void>;
        getVersion: () => Promise<string>;
        onStatus: (cb: (data: UpdateState) => void) => () => void;
      }
    | undefined;

  const [version, setVersion] = useState('');
  const [status, setStatus] = useState<UpdateState>({ state: 'idle' });

  useEffect(() => {
    if (!updater) return;
    updater.getVersion().then(setVersion).catch(() => {});
    const off = updater.onStatus((data) => setStatus(data));
    return off;
  }, []);

  // Chạy trên trình duyệt (không qua Electron) -> ẩn.
  if (!updater) return null;

  const busy =
    status.state === 'checking' || status.state === 'downloading' || status.state === 'available';

  const label = (() => {
    switch (status.state) {
      case 'checking': return 'Đang kiểm tra...';
      case 'available': return 'Đang tải bản mới...';
      case 'downloading': return `Đang tải ${status.percent ?? 0}%`;
      case 'downloaded': return 'Khởi động lại để cập nhật';
      case 'none': return 'Đã là bản mới nhất';
      case 'error': return 'Lỗi — thử lại';
      case 'dev': return 'Bản dev — bỏ qua';
      default: return 'Kiểm tra cập nhật';
    }
  })();

  const icon =
    status.state === 'downloaded' ? 'restart_alt' : busy ? 'autorenew' : 'system_update_alt';

  const onClick = () => {
    if (status.state === 'downloaded') {
      updater.quitAndInstall();
      return;
    }
    setStatus({ state: 'checking' });
    updater.check().catch(() => setStatus({ state: 'error' }));
  };

  return (
    <div className="flex items-center justify-between px-1 pt-2 mt-2 border-t border-white/5">
      <span className="text-[9px] text-white/25 font-medium tracking-wide">v{version}</span>
      <button
        onClick={onClick}
        disabled={busy}
        className={`text-[10px] flex items-center gap-1 transition-colors disabled:opacity-60 ${
          status.state === 'downloaded'
            ? 'text-emerald-400 hover:text-emerald-300'
            : status.state === 'error'
            ? 'text-red-400 hover:text-red-300'
            : 'text-white/40 hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[13px] ${busy ? 'animate-spin' : ''}`}>
          {icon}
        </span>
        <span>{label}</span>
      </button>
    </div>
  );
};
