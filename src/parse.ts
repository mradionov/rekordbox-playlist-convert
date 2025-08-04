import fsp from "fs/promises";
import {RekordboxXml} from "./rekordbox_xml.ts";

export async function parse(manifestPath): Promise<RekordboxXml> {
  const manifestData = await fsp.readFile(manifestPath, 'utf8');
  return RekordboxXml.parse(manifestData);
}
