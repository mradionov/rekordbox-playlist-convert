import url from 'url';
import path from 'path';
import fsp from 'fs/promises';
import fs from 'fs';

export function __dirname(): string {
  const __filename = url.fileURLToPath(import.meta.url);
  return path.dirname(__filename);
}

export function isHidden(filePath: string): boolean {
  return path.basename(filePath).startsWith('.');
}

export async function readJSON<T>(filePath: string) {
  const json = await fsp.readFile(filePath, 'utf8');
  return JSON.parse(json) as T;
}

export async function writeJSON<T>(filePath: string, obj: T): Promise<void> {
  const json = JSON.stringify(obj, null, 2);
  return await fsp.writeFile(filePath, json, 'utf8');
}

export async function exists(filePath: string): Promise<boolean> {
  try {
    await fsp.access(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

export async function mkdir(dirPath: string): Promise<void> {
  try {
    await fsp.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

export async function dirdirs(dirPath: string): Promise<string[]> {
  const dirents = await fsp.readdir(dirPath, { withFileTypes: true });
  return dirents.filter((d) => d.isDirectory()).map((d) => d.name);
}

export async function dirfiles(dirPath: string): Promise<string[]> {
  const dirents = await fsp.readdir(dirPath, { withFileTypes: true });
  return dirents.filter((d) => d.isFile()).map((d) => d.name);
}
