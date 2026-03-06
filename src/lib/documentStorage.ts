import { mkdir, writeFile, readFile, unlink, access } from 'fs/promises';
import path from 'path';

const BASE_DIR = path.join(process.cwd(), 'storage', 'documents');

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.spreadsheet',
  'text/csv',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const ALLOWED_EXT = new Set([
  'pdf', 'xls', 'xlsx', 'ods', 'csv', 'txt',
  'doc', 'docx', 'odt', 'jpg', 'jpeg', 'png', 'gif', 'webp',
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200) || 'file';
}

export function isAllowedMime(mime: string): boolean {
  if (ALLOWED_MIMES.has(mime)) return true;
  if (mime.startsWith('image/')) return true;
  return false;
}

export function isAllowedExt(ext: string): boolean {
  return ALLOWED_EXT.has(ext.toLowerCase());
}

export function validateFile(mime: string, size: number, originalName: string): string | null {
  if (size <= 0 || size > MAX_FILE_SIZE) return 'Tamanho do arquivo inválido (máx. 50 MB).';
  if (!isAllowedMime(mime)) return 'Tipo de arquivo não permitido.';
  const ext = originalName.split('.').pop()?.toLowerCase();
  if (ext && !isAllowedExt(ext)) return 'Extensão não permitida.';
  return null;
}

export async function ensureDir(): Promise<void> {
  await mkdir(BASE_DIR, { recursive: true });
}

export function buildStoragePath(documentId: number, originalName: string): string {
  const safe = sanitizeFileName(originalName);
  const ts = Date.now();
  const ext = path.extname(originalName) || '';
  const name = `${documentId}_${ts}${ext || (safe ? `.${safe}` : '')}`;
  return path.join(BASE_DIR, name);
}

export async function saveFile(documentId: number, originalName: string, buffer: Buffer): Promise<string> {
  await ensureDir();
  const fullPath = buildStoragePath(documentId, originalName);
  await writeFile(fullPath, buffer);
  return path.relative(process.cwd(), fullPath);
}

export async function readFileBuffer(relativePath: string): Promise<Buffer> {
  const fullPath = path.join(process.cwd(), relativePath);
  return readFile(fullPath);
}

export async function fileExists(relativePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(process.cwd(), relativePath);
    await access(fullPath);
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(relativePath: string): Promise<void> {
  const fullPath = path.join(process.cwd(), relativePath);
  await unlink(fullPath);
}
