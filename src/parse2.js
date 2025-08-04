import fsp from "fs/promises";
import {RekordboxXml} from "./rekordbox_xml.js";

export async function parse2(manifestPath) {
  const manifestData = await fsp.readFile(manifestPath, 'utf8');
  return RekordboxXml.parse(manifestData);
}
