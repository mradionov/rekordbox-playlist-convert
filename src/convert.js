import path from "path";
import fsp from "fs/promises";
import fs from "fs";
import util from 'util';
import childProcess from 'child_process';
import * as fsUtils from './fs_utils.js';

const exec = util.promisify(childProcess.exec);

export async function convert(collection, convertedDir) {
  const {folders} = collection;

  for (const folder of folders) {
    const folderPath = path.resolve(convertedDir, folder.name);
    await fsUtils.mkdir(folderPath);

    const existingPlaylists = new Set(await fsUtils.dirdirs(folderPath));

    for (const playlist of folder.playlists) {
      const playlistName = `${folder.name} - ${playlist.name}`;
      const playlistPath = path.resolve(folderPath, playlistName);
      await fsUtils.mkdir(playlistPath);

      existingPlaylists.delete(playlistName);

      const existingFiles = new Set(await fsUtils.dirfiles(playlistPath));

      for (const track of playlist.tracks) {
        const trackDestName = track.fileNameNoExt + '.mp3';
        const trackDestPath = path.resolve(playlistPath, trackDestName);

        existingFiles.delete(trackDestName);

        if (await fsUtils.exists(trackDestPath)) {
          continue;
        }

        if (!(await fsUtils.exists(track.path))) {
          console.log('Missing source file "%s" for "%s"', track.path, trackDestPath);
          continue;
        }

        if (track.ext === 'mp3') {
          await fsp.copyFile(track.path, trackDestPath);
          continue;
        }

        console.log('Converting: %s/%s/%s', folder.name, playlist.name, track.fileName);
        await convertTrack(track.path, trackDestPath);
      }

      for (const unusedFileName of existingFiles) {
        const unusedFilePath = path.resolve(playlistPath, unusedFileName);
        console.log('Removing unused file: %s', unusedFilePath);
        await fs.unlink(unusedFilePath, () => {
        });
      }
    }

    for (const unusedPlaylistName of existingPlaylists) {
      const unusedPlaylistPath = path.resolve(folderPath, unusedPlaylistName);
      console.log('Removing unused playlist: %s', unusedPlaylistPath);
      await fs.rm(unusedPlaylistPath, {recursive: true}, () => {
      });
    }
  }
}

async function convertTrack(srcPath, destPath) {
  const command = `ffmpeg -y -i "${srcPath}" -ab 320k "${destPath}"`;
  console.log({command});
  try {
    const {stdout, stderr} = await exec(command);
    console.log({stdout, stderr});
  } catch (err) {
    throw err;
  }
}
