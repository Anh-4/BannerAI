const { contextBridge, ipcRenderer } = require('electron');

// Cầu nối an toàn: giao diện (renderer) gọi được chức năng cập nhật ở tiến trình chính.
contextBridge.exposeInMainWorld('updater', {
  check: () => ipcRenderer.invoke('updater:check'),
  quitAndInstall: () => ipcRenderer.invoke('updater:quitAndInstall'),
  getVersion: () => ipcRenderer.invoke('app:version'),
  // Lắng nghe trạng thái cập nhật; trả về hàm hủy lắng nghe.
  onStatus: (cb) => {
    const listener = (_e, data) => cb(data);
    ipcRenderer.on('updater:status', listener);
    return () => ipcRenderer.removeListener('updater:status', listener);
  },
});
