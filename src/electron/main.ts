import { app, BrowserWindow, ipcMain, net, protocol } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const appRoot = path.resolve(__dirname, '..');
const distRoot = path.join(appRoot, 'dist');

let mainWindow: BrowserWindow | null = null;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'patriot',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

function resolveDistFile(requestUrl: string) {
  const url = new URL(requestUrl);
  const pathname = decodeURIComponent(url.pathname);
  const relativePath = path.normalize(pathname === '/' ? 'index.html' : pathname).replace(/^[/\\]+/, '');
  const filePath = path.join(distRoot, relativePath);
  const relativeToDist = path.relative(distRoot, filePath);

  if (relativeToDist.startsWith('..') || path.isAbsolute(relativeToDist)) {
    return path.join(distRoot, 'index.html');
  }

  return filePath;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 3840,
    height: 2160,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#05070a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void mainWindow.loadURL('patriot://app/index.html');
  }
}

app.whenReady().then(() => {
  protocol.handle('patriot', (request) => {
    return net.fetch(pathToFileURL(resolveDistFile(request.url)).toString());
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('patriot:launch-external', async (_event, target: string) => {
  return {
    ok: false,
    target,
    reason: 'External PT Vision launcher is not configured yet.',
  };
});
