import path from "path";
import type {CollectionXml, RekordboxXml, TrackXml, PlaylistNodeXml, PlaylistsXml} from "./rekordbox_xml.ts";

export class Library {
  readonly collection: Collection;
  readonly playlists: Playlists;

  private constructor(collection: Collection, playlists: Playlists) {
    this.collection = collection;
    this.playlists = playlists;
  }

  static fromRekordboxXml(xml: RekordboxXml): Library {
    const collectionXml = xml['DJ_PLAYLISTS']['COLLECTION'];
    const collection = Collection.fromXml(collectionXml);

    const playlistsXml = xml['DJ_PLAYLISTS']['PLAYLISTS'];
    const playlists = Playlists.fromXml(playlistsXml, collection);

    return new Library(collection, playlists);
  }

  // toXmlString() {
  //   const parts = [
  //     '<?xml version="1.0" encoding="UTF-8"?>',
  //     '<DJ_PLAYLISTS Version="1.0.0">',
  //     this.collection.toXmlString(),
  //     this.playlists.toXmlString(),
  //     '</DJ_PLAYLISTS>',
  //   ];
  //   return parts.join('\n');
  // }
}

type TrackKey = string;

class Collection {
  readonly trackMap = new Map<TrackKey, Track>();

  private constructor(tracks: Track[]) {
    for (const track of tracks) {
      this.trackMap.set(track.key, track);
    }
  }

  static fromXml(collectionXml: CollectionXml): Collection {
    const tracksXml = collectionXml['TRACK'];
    const tracks: Track[] = [];
    for (const trackXml of tracksXml) {
      const track = Track.fromXml(trackXml);
      tracks.push(track);
    }
    return new Collection(tracks);
  }

  find(trackKey: TrackKey): Track | undefined {
    return this.trackMap.get(trackKey);
  }
}

class Track {
  private readonly trackXml: TrackXml;

  private constructor(trackXml: TrackXml) {
    this.trackXml = trackXml;
  }

  static fromXml(trackXml: TrackXml): Track {
    return new Track(trackXml);
  }

  get key(): string {
    return this.trackXml['@_TrackID'];
  }

  get path(): string {
    return decodeURI(this.trackXml['@_Location'].replace(/^file:\/\/localhost/, '')).replaceAll('%26', '&');
  }

  get fileName(): string {
    return path.basename(this.path);
  }

  get ext(): string {
    const trackFileNameParts = this.fileName.split('.');
    return trackFileNameParts.pop();
  }

  get fileNameNoExt(): string {
    const trackFileNameParts = this.fileName.split('.');
    trackFileNameParts.pop();
    return trackFileNameParts.join('.');
  }
}

class Playlists {
  private readonly xml: PlaylistsXml;
  private readonly nodes: PlaylistNode[];

  private constructor(xml: PlaylistsXml, nodes: PlaylistNode[]) {
    this.xml = xml;
    this.nodes = nodes;
  }

  static fromXml(xml: PlaylistsXml, collection: Collection) {
    const rootXml = xml['NODE'];
    const root = PlaylistNode.fromXml(rootXml, collection);

    // root.print();

    return new Playlists(xml, [root]);
  }

  get rootNode(): PlaylistNode {
    return this.nodes[0];
  }

  findRootFolders(): PlaylistNode[] {
    return this.rootNode.findFolders();
  }
}

class PlaylistNode {
  readonly name: string;
  private readonly type: string;
  private readonly children: PlaylistNode[];
  private readonly tracks: Track[];

  constructor(
    name: string,
    type: string,
    children: PlaylistNode[] = [],
    tracks: Track[] = [],
  ) {
    this.name = name;
    this.type = type;
    this.children = children;
    this.tracks = tracks;
  }

  static fromXml(xml: PlaylistNodeXml, collection: Collection): PlaylistNode {
    const name = xml['@_Name'];
    const type = xml['@_Type'];
    const children: PlaylistNode[] = [];
    const tracks: Track[] = [];

    if (type === '0') {
      // Folder
      let childrenXml = xml['NODE'];
      if (!Array.isArray(childrenXml)) {
        childrenXml = [childrenXml];
      }
      for (const childNodeXml of childrenXml) {
        const childNode = PlaylistNode.fromXml(childNodeXml, collection);
        children.push(childNode);
      }
    } else if (type === '1') {
      // Playlist
      let tracksRefXml = xml['TRACK'];
      if (tracksRefXml === undefined) {
        tracksRefXml = [];
      }
      if (!Array.isArray(tracksRefXml)) {
        tracksRefXml = [tracksRefXml];
      }
      for (const trackRefXml of tracksRefXml) {
        const trackKey = trackRefXml['@_Key'];
        const track = collection.find(trackKey);
        if (!track) {
          throw new Error(`Missing track: "${trackKey}"`)
        }
        tracks.push(track);
      }
    } else {
      // Unknown
      throw new Error(`Unknown playlist node type: "${type}"`)
    }

    return new PlaylistNode(name, type, children, tracks)
  }

  findFolders(): PlaylistNode[] {
    return this.children.filter(node => node.isFolder);
  }

  findPlaylists(): PlaylistNode[] {
    return this.children.filter(node => node.isPlaylist);
  }

  findTracks(): Track[] {
    return this.tracks;
  }

  get isFolder(): boolean {
    return this.type === '0';
  }

  get isPlaylist(): boolean {
    return this.type === '1';
  }

  print(level = 0): void {
    console.log(`${'-'.repeat(level * 2)}${this.name} (${this.type})`);
    for (const child of this.children) {
      child.print(level + 1);
    }
    // for (const track of this.tracks) {
    //   console.log(`${'-'.repeat(level * 2) + ${track.nam}`);
    // }
  }
}
