export interface WordlistOptions {
  count: number;
  minLength: number;
  maxLength: number;
  includeNumbers: boolean;
  includeSpecialChars: boolean;
  capitalize: boolean;
  separator: string;
}

export interface GeneratedWordlist {
  words: string[];
  options: WordlistOptions;
  generatedAt: Date;
}

// Common word lists for realistic wordlist generation
const commonWords = [
  'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'abuse', 'access', 'accident',
  'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act', 'action', 'active',
  'activity', 'actor', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admin', 'admit',
  'adobe', 'adopt', 'adore', 'adorn', 'adult', 'advance', 'advice', 'advise', 'affair', 'afford',
  'afraid', 'after', 'again', 'against', 'agency', 'agenda', 'agent', 'agree', 'ahead', 'alarm',
  'album', 'alert', 'alien', 'align', 'alike', 'alive', 'allow', 'alloy', 'allure', 'ally',
  'almost', 'alone', 'along', 'already', 'also', 'alter', 'always', 'amateur', 'amaze', 'ambiguous',
  'ambition', 'ambush', 'amend', 'america', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient',
  'android', 'angel', 'anger', 'angle', 'angry', 'animal', 'ankle', 'annex', 'announce', 'annoy',
  'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety', 'anxious', 'anybody', 'anyhow', 'anyone',
  'anything', 'anyway', 'anywhere', 'apart', 'apology', 'appear', 'apple', 'apply', 'appoint', 'appraise',
  'appreciate', 'approach', 'approve', 'april', 'apron', 'aqua', 'arab', 'arcade', 'arch', 'archer',
  'arctic', 'area', 'arena', 'argue', 'argument', 'arise', 'arm', 'armed', 'armor', 'army',
  'aroma', 'around', 'arrange', 'arrest', 'arrival', 'arrive', 'arrow', 'art', 'artefact', 'artist',
  'artwork', 'ask', 'aspect', 'assault', 'asset', 'assign', 'assist', 'assume', 'asthma', 'astonish',
  'astray', 'astrology', 'astronaut', 'astronomy', 'asylum', 'athlete', 'atom', 'atone', 'atop', 'atrocious',
  'attach', 'attack', 'attain', 'attempt', 'attend', 'attention', 'attentive', 'attest', 'attic', 'attire',
  'attitude', 'attorney', 'attract', 'auction', 'audit', 'august', 'aunt', 'aura', 'aural', 'austere',
  'australia', 'austria', 'authentic', 'author', 'autism', 'auto', 'autumn', 'average', 'averse', 'aversion',
  'avert', 'avid', 'avocado', 'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awfully',
  'awhile', 'awkward', 'awning', 'awoke', 'awry', 'axe', 'axiom', 'axis', 'axle', 'axon',
];

const specialCharacters = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export function generateWordlist(options: WordlistOptions): GeneratedWordlist {
  const words: string[] = [];
  const usedWords = new Set<string>();

  while (words.length < options.count) {
    let word = getRandomWord();

    // Filter by length
    if (word.length < options.minLength || word.length > options.maxLength) {
      continue;
    }

    // Avoid duplicates
    if (usedWords.has(word)) {
      continue;
    }

    // Apply transformations
    if (options.capitalize) {
      word = capitalizeWord(word);
    }

    if (options.includeNumbers) {
      word += getRandomNumber();
    }

    if (options.includeSpecialChars) {
      word += getRandomSpecialChar();
    }

    words.push(word);
    usedWords.add(word);
  }

  return {
    words,
    options,
    generatedAt: new Date(),
  };
}

export function formatWordlist(wordlist: GeneratedWordlist, separator: string = '\n'): string {
  return wordlist.words.join(separator);
}

export function downloadWordlist(wordlist: GeneratedWordlist, filename: string = 'wordlist.txt') {
  const content = formatWordlist(wordlist, '\n');
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function copyToClipboard(wordlist: GeneratedWordlist, separator: string = '\n'): Promise<void> {
  const content = formatWordlist(wordlist, separator);
  return navigator.clipboard.writeText(content);
}

function getRandomWord(): string {
  return commonWords[Math.floor(Math.random() * commonWords.length)];
}

function getRandomNumber(): string {
  return Math.floor(Math.random() * 10).toString();
}

function getRandomSpecialChar(): string {
  return specialCharacters[Math.floor(Math.random() * specialCharacters.length)];
}

function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function getWordlistStats(wordlist: GeneratedWordlist) {
  const totalChars = wordlist.words.reduce((sum, word) => sum + word.length, 0);
  const avgLength = Math.round(totalChars / wordlist.words.length);

  return {
    totalWords: wordlist.words.length,
    totalCharacters: totalChars,
    averageWordLength: avgLength,
    estimatedFileSize: `${(totalChars / 1024).toFixed(2)} KB`,
  };
}
