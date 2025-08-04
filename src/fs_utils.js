import url from 'url';
import path from 'path';
import fsp from 'fs/promises';
import fs from 'fs';

export function __dirname() {
  const __filename = url.fileURLToPath(import.meta.url);
  return path.dirname(__filename);
}

export function isHidden(filePath) {
  return path.basename(filePath).startsWith('.');
}

export async function readJSON(filePath) {
  const json = await fsp.readFile(filePath, 'utf8');
  return JSON.parse(json);
}

export async function writeJSON(filePath, obj) {
  const json = JSON.stringify(obj, null, 2);
  return await fsp.writeFile(filePath, json, 'utf8');
}

export async function exists(filePath) {
  try {
    await fsp.access(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

export async function mkdir(dirPath) {
  try {
    await fsp.mkdir(dirPath, {recursive: true});
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

export async function dirdirs(dirPath) {
  const dirents = await fsp.readdir(dirPath, {withFileTypes: true});
  return dirents.filter(d => d.isDirectory()).map(d => d.name);
}

export async function dirfiles(dirPath) {
  const dirents = await fsp.readdir(dirPath, {withFileTypes: true});
  return dirents.filter(d => d.isFile()).map(d => d.name);
}
