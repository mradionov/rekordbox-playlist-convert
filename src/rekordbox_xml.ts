import path from "path";
import {XMLParser} from "fast-xml-parser";

const xmlParser = new XMLParser({ignoreAttributes: false});

export class RekordboxXml {
  readonly collection: Collection;
  readonly playlists: Playlists;

  constructor(collection: Collection, playlists: Playlists) {
    this.collection = collection;
    this.playlists = playlists;
  }

  static parse(xmlString: string): RekordboxXml {
    const xml = xmlParser.parse(xmlString);

    const collectionXml = xml['DJ_PLAYLISTS']['COLLECTION'];
    const collection = Collection.fromXmlObject(collectionXml);

    const playlistsXml = xml['DJ_PLAYLISTS']['PLAYLISTS'];
    const playlists = Playlists.fromXmlObject(playlistsXml, collection);

    return new RekordboxXml(collection, playlists);
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

  constructor(tracks: Track[]) {
    for (const track of tracks) {
      this.trackMap.set(track.key, track);
    }
  }

  static fromXmlObject(collectionXml): Collection {
    const tracksXml = collectionXml['TRACK'];
    const tracks = [];
    for (const trackXml of tracksXml) {
      const track = Track.fromXmlObject(trackXml);
      tracks.push(track);
    }
    return new Collection(tracks);
  }

  find(trackKey: TrackKey): Track | undefined {
    return this.trackMap.get(trackKey);
  }
}

class Track {
  private readonly trackXml: object;

  constructor(trackXml: object) {
    this.trackXml = trackXml;
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

  static fromXmlObject(trackXml) {
    return new Track(trackXml);
  }
}

class Playlists {
  private readonly xml: object;
  private readonly nodes: PlaylistNode[];

  constructor(xml: object, nodes: PlaylistNode[]) {
    this.xml = xml;
    this.nodes = nodes;
  }

  get rootNode(): PlaylistNode {
    return this.nodes[0];
  }

  findRootFolders(): PlaylistNode[] {
    return this.rootNode.findFolders();
  }

  static fromXmlObject(xml: object, collection: Collection) {
    const rootXml = xml['NODE'];
    const root = PlaylistNode.fromXmlObject(rootXml, collection);

    // root.print();

    return new Playlists(xml, [root]);
  }

  toXmlString(): object {
    return this.xml;
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

  static fromXmlObject(xml: object, collection: Collection): PlaylistNode {
    const name = xml['@_Name'];
    const type = xml['@_Type'];
    const children = [];
    const tracks = [];

    if (type === '0') {
      // Folder
      let childrenXml = xml['NODE'];
      if (!Array.isArray(childrenXml)) {
        childrenXml = [childrenXml];
      }
      for (const childNodeXml of childrenXml) {
        const childNode = PlaylistNode.fromXmlObject(childNodeXml, collection);
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
