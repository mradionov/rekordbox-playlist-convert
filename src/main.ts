import { confirm } from '@inquirer/prompts';
import { getSettings } from './settings.ts';
import { parse } from './parse.ts';
import { convert } from './convert.ts';

async function main() {
  const settings = await getSettings();

  console.log('Settings', settings);

  const library = await parse(settings.manifestPath);

  const shouldStart = await promptStartConvert();
  if (!shouldStart) {
    return;
  }

  await convert(library, settings.convertedDir);
}

async function promptStartConvert() {
  return await confirm({
    message: 'Start conversion?',
  });
}

void main();
