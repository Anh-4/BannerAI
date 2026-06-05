const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

const isDev = !!process.env.ELECTRON_DEV;

function broadcast(channel, payload) {
  for (const w of BrowserWindow.getAllWindows()) {
    w.webContents.send(channel, payload);
  }
}

// Chuyển các sự kiện của autoUpdater về giao diện để nút "Kiểm tra cập nhật" hiển thị trạng thái.
function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => broadcast('updater:status', { state: 'checking' }));
  autoUpdater.on('update-available', (info) => broadcast('updater:status', { state: 'available', version: info?.version }));
  autoUpdater.on('update-not-available', (info) => broadcast('updater:status', { state: 'none', version: info?.version }));
  autoUpdater.on('download-progress', (p) => broadcast('updater:status', { state: 'downloading', percent: Math.round(p?.percent || 0) }));
  autoUpdater.on('update-downloaded', (info) => broadcast('updater:status', { state: 'downloaded', version: info?.version }));
  autoUpdater.on('error', (e) => broadcast('updater:status', { state: 'error', message: e?.message || String(e) }));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 1000,
    minHeight: 640,
    backgroundColor: '#0e0e0e',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Mở link ngoài bằng trình duyệt mặc định, không mở trong app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// --- IPC cho nút "Kiểm tra cập nhật" trong app ---
ipcMain.handle('app:version', () => app.getVersion());

ipcMain.handle('updater:check', async () => {
  if (isDev) {
    broadcast('updater:status', { state: 'dev' });
    return { state: 'dev' };
  }
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (e) {
    broadcast('updater:status', { state: 'error', message: e?.message || String(e) });
    return { ok: false };
  }
});

ipcMain.handle('updater:quitAndInstall', () => {
  autoUpdater.quitAndInstall();
});

app.whenReady().then(() => {
  setupAutoUpdater();
  createWindow();

  // Tự kiểm tra cập nhật khi mở (bỏ qua khi dev). Tải ngầm, cài khi thoát app.
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify().catch((e) =>
      console.error('[auto-update]', e?.message || e)
    );
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
