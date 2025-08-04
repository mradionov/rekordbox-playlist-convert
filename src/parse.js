import path from "path";
import fsp from "fs/promises";
import {XMLParser} from "fast-xml-parser";

export async function parse(manifestPath) {
  const manifestData = await fsp.readFile(manifestPath, 'utf8');

  const parser = new XMLParser({ignoreAttributes: false});
  const xml = parser.parse(manifestData);

  const collectionTracksMap = new Map();
  const collectionTracksXml = xml['DJ_PLAYLISTS']['COLLECTION']['TRACK'];
  for (const trackXml of collectionTracksXml) {
    const trackKey = trackXml['@_TrackID'];
    collectionTracksMap.set(trackKey, trackXml);
  }

  const folders = [];

  const foldersXml = xml['DJ_PLAYLISTS']['PLAYLISTS']['NODE']['NODE'];
  for (const folderXml of foldersXml) {
    if (folderXml['@_Type'] !== '0') {
      console.log('Skipped non-folder: "%s"', folderXml['@_Name']);
      continue;
    }

    const folder = {
      name: folderXml['@_Name'],
      playlists: [],
    };

    let playlistsXml = folderXml['NODE'];
    if (!Array.isArray(playlistsXml) && playlistsXml['@_Type'] === '1') {
      playlistsXml = [playlistsXml];
    }
    for (const playlistXml of playlistsXml) {
      const playlist = {
        name: playlistXml['@_Name'],
        tracks: [],
      };
      let tracksRefXml = playlistXml['TRACK'];
      if (tracksRefXml === undefined) {
        tracksRefXml = [];
      }
      if (!Array.isArray(tracksRefXml)) {
        tracksRefXml = [tracksRefXml];
      }
      for (const trackRefXml of tracksRefXml) {
        const trackKey = trackRefXml['@_Key'];
        const trackXml = collectionTracksMap.get(trackKey);

        const trackPath = decodeURI(trackXml['@_Location'].replace(/^file:\/\/localhost/, '')).replaceAll('%26', '&');
        const trackFileName = path.basename(trackPath);
        const trackFileNameParts = trackFileName.split('.');
        const trackExt = trackFileNameParts.pop();
        const trackNameNoExt = trackFileNameParts.join('.');

        const track = {
          path: trackPath,
          fileName: trackFileName,
          fileNameNoExt: trackNameNoExt,
          ext: trackExt,
        };
        playlist.tracks.push(track);
      }

      folder.playlists.push(playlist);
    }

    folders.push(folder);
  }

  return {
    folders,
  };
}
