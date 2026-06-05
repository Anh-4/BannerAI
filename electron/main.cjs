const { app, BrowserWindow, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

const isDev = !!process.env.ELECTRON_DEV;

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 1000,
    minHeight: 640,
    backgroundColor: '#0e0e0e',
    autoHideMenuBar: true,
    webPreferences: {
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

app.whenReady().then(() => {
  createWindow();

  // Auto-update: chỉ chạy ở bản đã đóng gói (bản cài Setup), bỏ qua khi dev/portable.
  // Tải bản mới ở nền, cài tự động khi người dùng thoát app -> lần mở sau là bản mới.
  if (!isDev) {
    autoUpdater.on('error', (e) => console.error('[auto-update]', e?.message || e));
    autoUpdater.checkForUpdatesAndNotify().catch((e) =>
      console.error('[auto-update] check failed:', e?.message || e)
    );
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
