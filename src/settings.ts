import os from 'os';
import path from 'path';
import { confirm } from '@inquirer/prompts';
import fileSelector from 'inquirer-file-selector';
import * as fsUtils from './fs_utils.ts';

const CACHE_DIR = path.join(fsUtils.__dirname(), '..', 'cache');
const SETTINGS_CACHE_PATH = path.join(CACHE_DIR, 'settings.json');

type Settings = {
  manifestPath?: string;
  convertedDir?: string;
  shouldSave?: boolean;
};

export async function getSettings(): Promise<Settings> {
  const savedSettings = await loadSavedSettings();

  if (savedSettings) {
    console.log('Saved: ', savedSettings);
    const useSaved = await promptUseSaved();
    if (useSaved) {
      return savedSettings;
    }
  }

  const settings = await promptSettings(savedSettings);

  if (settings.shouldSave) {
    await saveSettings(settings);
  }

  return settings;
}

async function saveSettings(settings: Settings): Promise<void> {
  await fsUtils.mkdir(CACHE_DIR);
  return fsUtils.writeJSON(SETTINGS_CACHE_PATH, settings);
}

async function loadSavedSettings(): Promise<Settings> {
  try {
    return await fsUtils.readJSON<Settings>(SETTINGS_CACHE_PATH);
  } catch (e) {
    console.warn('Could not find cached settings');
    return {};
  }
}

async function promptUseSaved() {
  return await confirm({
    message: 'Use saved input?',
  });
}

const fileFilter = (file) => !fsUtils.isHidden(file.path);

async function promptSettings(savedSettings: Settings = {}): Promise<Settings> {
  const manifestPath = await fileSelector({
    message: 'Path to Rekordbox collection XML file',
    type: 'file',
    // TODO: Pre-selection for a file not available
    //  https://github.com/br14n-sol/inquirer-file-selector/issues/98
    basePath: savedSettings.manifestPath
      ? path.dirname(savedSettings.manifestPath)
      : os.homedir(),
    filter: fileFilter,
  });

  const convertedDir = await fileSelector({
    message: 'Directory for converted playlists',
    type: 'directory',
    basePath: savedSettings.convertedDir
      ? path.dirname(savedSettings.convertedDir)
      : os.homedir(),
    filter: fileFilter,
  });

  const shouldSave = await confirm({
    message: 'Save settings?',
  });

  return {
    ...savedSettings,
    manifestPath,
    convertedDir,
    shouldSave,
  };
}
