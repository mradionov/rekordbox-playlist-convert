import fsp from "fs/promises";
import {XMLParser} from "fast-xml-parser";
import {Library} from "./library.ts";
import type {RekordboxXml} from "./rekordbox_xml.ts";

export async function parse(manifestPath): Promise<RekordboxXml> {
  const manifestData = await fsp.readFile(manifestPath, 'utf8');

  const xmlParser = new XMLParser({ignoreAttributes: false});

  const rekordboxXml = xmlParser.parse(manifestData) as RekordboxXml;

  return Library.fromRekordboxXml(rekordboxXml);
}
