export type RekordboxXml = {
  DJ_PLAYLISTS: {
    COLLECTION: CollectionXml;
    PLAYLISTS: PlaylistsXml;
  }
};

export type CollectionXml = {
  TRACK: TrackXml[];
};

export type TrackXml = {
  ['@_TrackID']: string;
  ['@_Location']: string;
};

export type PlaylistsXml = FolderXml;

export type PlaylistNodeXml = FolderXml | PlaylistXml;

export type FolderXml = {
  ['@_Name']: string;
  ['@_Type']: '0';
  NODE: PlaylistNodeXml;
};

export type PlaylistXml = {
  ['@_Name']: string;
  ['@_Type']: '1';
  TRACK: TrackRefXml[];
};

export type TrackRefXml = {
  ['@_Key']: string;
};
