import os from 'os';
import path from 'path';
import {confirm} from "@inquirer/prompts";
import fileSelector from 'inquirer-file-selector'
import * as fsUtils from './fs_utils.js';

const fileFilter = (file) => !fsUtils.isHidden(file.path);

export async function promptUseSaved() {
  return await confirm({
    message: 'Use saved input?'
  });
}

export async function promptStartConvert() {
  return await confirm({
    message: 'Start conversion?'
  });
}

export async function promptAnswers(savedAnswers = {}) {
  const manifestPath = await fileSelector({
    message: 'Path to Rekordbox collection XML file',
    type: 'file',
    // TODO: Pre-selection for a file not available
    //  https://github.com/br14n-sol/inquirer-file-selector/issues/98
    basePath: savedAnswers.manifestPath
      ? path.dirname(savedAnswers.manifestPath)
      : os.homedir(),
    filter: fileFilter,
  });

  const convertedDir = await fileSelector({
    message: 'Directory for converted playlists',
    type: 'directory',
    basePath: savedAnswers.convertedDir
      ? path.dirname(savedAnswers.convertedDir)
      : os.homedir(),
    filter: fileFilter,
  })

  const shouldSaveAnswers = await confirm({
    message: 'Save answers?',
  });

  return {
    ...savedAnswers,
    manifestPath,
    convertedDir,
    shouldSaveAnswers,
  };
}


