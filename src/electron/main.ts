import { app, BrowserWindow, ipcMain, protocol, screen } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { focusExternalTarget } from './externalTargets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const appRoot = path.resolve(__dirname, '..');
const distRoot = path.join(appRoot, 'dist');
const rangeHeaderPattern = /^bytes=(\d*)-(\d*)$/;

let mainWindow: BrowserWindow | null = null;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'patriot',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
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

function getContentType(filePath: string) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    case '.webm':
      return 'video/webm';
    case '.mp4':
      return 'video/mp4';
    case '.woff2':
      return 'font/woff2';
    case '.otf':
      return 'font/otf';
    default:
      return 'application/octet-stream';
  }
}

function createFileBody(filePath: string, options?: { start?: number; end?: number }) {
  return Readable.toWeb(fs.createReadStream(filePath, options)) as unknown as BodyInit;
}

async function createDistFileResponse(request: Request) {
  let filePath = resolveDistFile(request.url);
  let stats: fs.Stats;

  try {
    stats = await fs.promises.stat(filePath);
  } catch {
    filePath = path.join(distRoot, 'index.html');
    stats = await fs.promises.stat(filePath);
  }

  if (!stats.isFile()) {
    filePath = path.join(distRoot, 'index.html');
    stats = await fs.promises.stat(filePath);
  }

  const contentType = getContentType(filePath);
  const rangeHeader = request.headers.get('range');
  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
    'Content-Type': contentType,
  });

  if (rangeHeader) {
    const rangeMatch = rangeHeader.match(rangeHeaderPattern);

    if (!rangeMatch) {
      return new Response(null, { status: 416, headers });
    }

    const start = rangeMatch[1] ? Number(rangeMatch[1]) : 0;
    const end = rangeMatch[2] ? Math.min(Number(rangeMatch[2]), stats.size - 1) : stats.size - 1;

    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= stats.size) {
      headers.set('Content-Range', `bytes */${stats.size}`);
      return new Response(null, { status: 416, headers });
    }

    headers.set('Content-Length', String(end - start + 1));
    headers.set('Content-Range', `bytes ${start}-${end}/${stats.size}`);

    return new Response(request.method === 'HEAD' ? null : createFileBody(filePath, { start, end }), {
      status: 206,
      headers,
    });
  }

  headers.set('Content-Length', String(stats.size));

  return new Response(request.method === 'HEAD' ? null : createFileBody(filePath), {
    status: 200,
    headers,
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 3840,
    height: 2160,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#05070a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
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
    return createDistFileResponse(request);
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
  const displayAreas = screen.getAllDisplays().flatMap((display) => [
    display.bounds,
    display.workArea,
  ]);
  const result = await focusExternalTarget(target, appRoot, { displayAreas });

  if (result.ok) {
    console.info('External target focus succeeded:', result);
  } else {
    console.warn('External target focus failed:', result);
  }

  return result;
});
