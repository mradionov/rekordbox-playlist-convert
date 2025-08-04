import {loadSavedAnswers, saveAnswers} from './cache.js'
import {promptAnswers, promptStartConvert, promptUseSaved} from './prompt.js'
import {parse} from './parse.js'
import {parse2} from './parse2.js'
import {convert} from "./convert.js";
import {convert2} from "./convert2.js";

async function main() {
  const answers = await getAnswers();

  console.log('Input', answers);

  // const collection = await parse(answers.manifestPath);
  const rbXml = await parse2(answers.manifestPath);

  // console.log('Parsed collection', collection);

  const shouldStart = await promptStartConvert();
  if (!shouldStart) {
    return;
  }

  await convert2(rbXml, answers.convertedDir);
}

async function getAnswers() {
  const savedAnswers = await loadSavedAnswers();
  if (savedAnswers) {
    console.log('Saved: ', savedAnswers);
    const useSaved = await promptUseSaved();
    if (useSaved) {
      return savedAnswers;
    }
  }

  const answers = await promptAnswers(savedAnswers);

  if (answers.shouldSaveAnswers) {
    await saveAnswers(answers);
  }

  return answers;
}

void main();
