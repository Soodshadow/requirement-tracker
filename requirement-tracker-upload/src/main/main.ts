import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import log from 'electron-log';
import { fork, ChildProcess } from 'child_process';

log.initialize();
log.info('Application starting...');

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

function startServer(): void {
  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, 'server', 'index.js')
    : path.join(__dirname, '..', '..', 'server', 'index.js');

  serverProcess = fork(serverPath, [], {
    stdio: 'pipe',
    detached: false,
  });

  serverProcess.on('error', (err) => {
    log.error('Server process error:', err);
  });

  serverProcess.on('exit', (code) => {
    log.info(`Server process exited with code: ${code}`);
  });

  log.info('Server process started');
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload', 'preload.js'),
    },
    title: '需求追踪系统',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    log.info('Main window ready to show');
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-server-url', () => {
  return 'http://localhost:3001';
});