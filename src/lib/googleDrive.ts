/**
 * Google Drive API Service — Sync & Automatic Backup for LibraryTracker
 * Uses appDataFolder (https://www.googleapis.com/auth/drive.appdata)
 * to store backups in the user's hidden private application folder.
 */

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
  md5Checksum?: string;
}

const GDRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const STORAGE_KEY_TOKEN = 'librarytracker_gdrive_token';
const STORAGE_KEY_LAST_BACKUP = 'librarytracker_gdrive_last_backup';
const STORAGE_KEY_AUTO_BACKUP = 'librarytracker_gdrive_auto_backup';

export interface DriveTokenState {
  accessToken: string;
  expiresAt: number;
}

/**
 * Obtiene el token guardado en localStorage si aún no ha caducado
 */
export function getSavedDriveToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (!raw) return null;
    const data: DriveTokenState = JSON.parse(raw);
    if (Date.now() >= data.expiresAt - 60000) {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      return null;
    }
    return data.accessToken;
  } catch {
    return null;
  }
}

/**
 * Guarda el token de acceso con su tiempo de expiración
 */
export function saveDriveToken(accessToken: string, expiresInSeconds: number = 3600) {
  const data: DriveTokenState = {
    accessToken,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };
  localStorage.setItem(STORAGE_KEY_TOKEN, JSON.stringify(data));
}

/**
 * Elimina el token de acceso guardado
 */
export function clearDriveToken() {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
}

/**
 * Obtiene la fecha de la última copia realizada en Google Drive
 */
export function getLastBackupTimestamp(): string | null {
  return localStorage.getItem(STORAGE_KEY_LAST_BACKUP);
}

/**
 * Guarda la marca de tiempo de la última copia de seguridad
 */
export function setLastBackupTimestamp(isoDate: string) {
  localStorage.setItem(STORAGE_KEY_LAST_BACKUP, isoDate);
}

/**
 * Comprueba si el auto-backup está activado
 */
export function isAutoBackupEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY_AUTO_BACKUP) === 'true';
}

/**
 * Configura la preferencia de auto-backup
 */
export function setAutoBackupEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY_AUTO_BACKUP, enabled ? 'true' : 'false');
}

const STORAGE_KEY_CUSTOM_CLIENT_ID = 'librarytracker_custom_gdrive_client_id';

export function getCustomClientId(): string {
  return localStorage.getItem(STORAGE_KEY_CUSTOM_CLIENT_ID) || '';
}

export function setCustomClientId(clientId: string) {
  if (clientId.trim()) {
    localStorage.setItem(STORAGE_KEY_CUSTOM_CLIENT_ID, clientId.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_CLIENT_ID);
  }
}

/**
 * Solicita autorización del usuario con Google Identity Services (GIS)
 * Abre el popup oficial de Google OAuth para solicitar acceso a appDataFolder
 */
export async function requestGoogleDriveAccess(clientId?: string): Promise<string> {
  let gClientId =
    clientId ||
    getCustomClientId() ||
    import.meta.env.GOOGLE_CLIENT_ID ||
    import.meta.env.PUBLIC_GOOGLE_CLIENT_ID;

  if (!gClientId) {
    try {
      const res = await fetch('/api/config/google-client-id');
      if (res.ok) {
        const data = await res.json();
        if (data.clientId) gClientId = data.clientId;
      }
    } catch {
      // Fallback
    }
  }

  if (!gClientId || !gClientId.trim()) {
    throw new Error(
      'Falta la clave Client ID de Google OAuth. Configura GOOGLE_CLIENT_ID en tu archivo .env o en Vercel.'
    );
  }

  return new Promise((resolve, reject) => {

    // Verificar que la librería GIS esté disponible o cargarla dinámicamente
    if (typeof (window as any).google === 'undefined' || !(window as any).google.accounts?.oauth2) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initOAuthFlow(gClientId, resolve, reject);
      };
      script.onerror = () => {
        reject(new Error('No se pudo cargar la librería Google Identity Services.'));
      };
      document.head.appendChild(script);
    } else {
      initOAuthFlow(gClientId, resolve, reject);
    }
  });
}

function initOAuthFlow(
  clientId: string,
  resolve: (token: string) => void,
  reject: (err: Error) => void
) {
  try {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GDRIVE_SCOPE,
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(`Error de autenticación con Google: ${response.error}`));
          return;
        }
        if (response.access_token) {
          const expiresIn = response.expires_in ? parseInt(response.expires_in) : 3600;
          saveDriveToken(response.access_token, expiresIn);
          resolve(response.access_token);
        } else {
          reject(new Error('No se recibió el token de acceso de Google.'));
        }
      },
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } catch (err: any) {
    reject(err);
  }
}

/**
 * Lista todos los archivos de backup guardados en appDataFolder ordenados por fecha descendente
 */
export async function listDriveBackups(token: string): Promise<DriveBackupFile[]> {
  const url =
    'https://www.googleapis.com/drive/v3/files?' +
    new URLSearchParams({
      spaces: 'appDataFolder',
      fields: 'files(id, name, createdTime, size, md5Checksum)',
      orderBy: 'createdTime desc',
      pageSize: '20',
    });

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearDriveToken();
      throw new Error('La sesión de Google Drive ha expirado. Por favor, vuelve a conectar.');
    }
    const errText = await res.text();
    throw new Error(`Error al consultar Google Drive: ${errText}`);
  }

  const data = await res.ok ? await res.json() : { files: [] };
  return (data.files || []).filter((f: any) => f.name.startsWith('librarytracker-backup-'));
}

/**
 * Sube un archivo JSON de copia de seguridad a appDataFolder y aplica rotación (máx 5 copias)
 */
export async function uploadDriveBackup(
  token: string,
  backupData: object,
  customFilename?: string
): Promise<DriveBackupFile> {
  const now = new Date();
  const timestampStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = customFilename || `librarytracker-backup-${timestampStr}.json`;

  const metadata = {
    name: filename,
    parents: ['appDataFolder'],
    mimeType: 'application/json',
  };

  const fileContent = JSON.stringify(backupData, null, 2);

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearDriveToken();
      throw new Error('Sesión de Google expirada. Vuelve a conectar tu cuenta.');
    }
    const errText = await res.text();
    throw new Error(`No se pudo subir la copia a Google Drive: ${errText}`);
  }

  const uploadedFile: DriveBackupFile = await res.json();
  setLastBackupTimestamp(now.toISOString());

  // Aplicar rotación: Conservar solo las últimas 5 copias
  try {
    await rotateDriveBackups(token, 5);
  } catch (rotateErr) {
    console.warn('⚠️ No se pudo rotar las copias antiguas de Google Drive:', rotateErr);
  }

  return uploadedFile;
}

/**
 * Descarga y parsea el contenido JSON de una copia desde Google Drive
 */
export async function downloadDriveBackup(token: string, fileId: string): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearDriveToken();
      throw new Error('Sesión de Google expirada.');
    }
    throw new Error(`Error al descargar la copia desde Google Drive (Status ${res.status})`);
  }

  return await res.json();
}

/**
 * Elimina una copia de seguridad específica de Google Drive
 */
export async function deleteDriveBackup(token: string, fileId: string): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`No se pudo eliminar el archivo de Google Drive.`);
  }
}

/**
 * Rotación de versiones: Conservar como máximo N copias (por defecto 5), eliminando las más antiguas
 */
export async function rotateDriveBackups(token: string, maxFiles: number = 5): Promise<number> {
  const files = await listDriveBackups(token);
  if (files.length <= maxFiles) return 0;

  const filesToDelete = files.slice(maxFiles);
  let deletedCount = 0;

  for (const file of filesToDelete) {
    try {
      await deleteDriveBackup(token, file.id);
      deletedCount++;
    } catch (e) {
      console.warn(`Falló la eliminación del backup antiguo ${file.id}:`, e);
    }
  }

  return deletedCount;
}

/**
 * Dispara de forma silenciosa e ininterrumpida un auto-backup en segundo plano si está activado
 */
export async function triggerAutoDriveBackupIfEnabled() {
  try {
    if (!isAutoBackupEnabled()) return;
    const token = getSavedDriveToken();
    if (!token) return;

    // Importaciones dinámicas para evitar dependencias circulares
    const { supabase, getLibraryItems } = await import('./supabase');
    const { createBackupPayload } = await import('./backupService');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const items = await getLibraryItems(user.id);
    const payload = await createBackupPayload(user.id, items);
    await uploadDriveBackup(token, payload);
    console.log('☁️ Copia de seguridad automática en Google Drive realizada en segundo plano.');
  } catch (err) {
    console.warn('⚠️ No se pudo completar la copia automática silenciosa:', err);
  }
}
