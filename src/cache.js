import path from "path";
import * as fsUtils from "./fs_utils.js";

const CACHE_DIR = path.join(fsUtils.__dirname(), '..', 'cache');
const ANSWERS_CACHE_PATH = path.join(CACHE_DIR, 'answers.json');

export async function saveAnswers(answers) {
  await fsUtils.mkdir(CACHE_DIR);
  return fsUtils.writeJSON(ANSWERS_CACHE_PATH, answers);
}

export async function loadSavedAnswers() {
  try {
    return await fsUtils.readJSON(ANSWERS_CACHE_PATH);
  } catch (e) {
    console.warn('Could not find cached answers');
    return {};
  }
}
