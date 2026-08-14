const fs = require('fs');
const path = require('path');

const hymnsFilePath = path.join(__dirname, '../lib/rccg-hymns.json');
const rawData = fs.readFileSync(hymnsFilePath, 'utf8');
const hymns = JSON.parse(rawData);

console.log(`Loaded ${hymns.length} hymns for processing...`);

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&bull;/g, '•')
    .trim();
}

let scriptureExtracted = 0;
let categoryExtracted = 0;

const processedHymns = hymns.map(hymn => {
  const rawText = decodeHtmlEntities(Array.isArray(hymn.verses) && hymn.verses.length ? hymn.verses[0] : '');

  // Extract Scripture Reference (e.g. "Go work today in my vineyard." - Mat 21:28)
  let scriptureRef = null;
  if (rawText) {
    const scriptMatch = rawText.match(/"([^"\r\n]+)"\s*-\s*([A-Za-z0-9\s\.\:\,\-]+)/);
    if (scriptMatch) {
      const quote = scriptMatch[1].trim();
      const refLine = scriptMatch[2].split('\n')[0].trim();
      scriptureRef = `"${quote}" — ${refLine}`;
      scriptureExtracted++;
    }
  }

  // Extract Category
  let category = null;
  if (rawText) {
    const headerLines = rawText.split('\n').slice(0, 15);
    for (const line of headerLines) {
      const trimmed = line.trim();
      if (
        trimmed &&
        !trimmed.startsWith('.verse') &&
        !trimmed.startsWith('{') &&
        !trimmed.startsWith('background') &&
        !trimmed.startsWith('RCCG HYMN') &&
        !trimmed.includes(hymn.title) &&
        !trimmed.includes('"') &&
        !trimmed.includes('VERSES') &&
        !trimmed.includes(':root') &&
        trimmed.length > 2 &&
        trimmed.length < 40 &&
        trimmed === trimmed.toUpperCase()
      ) {
        category = trimmed;
        categoryExtracted++;
        break;
      }
    }
  }

  // Extract verse count
  let verseCount = hymn.verse_count || null;
  if (rawText) {
    const verseCountMatch = rawText.match(/(\d+)\s+VERSES/i);
    if (verseCountMatch) {
      verseCount = parseInt(verseCountMatch[1], 10);
    }
  }

  return {
    number: hymn.number,
    title: decodeHtmlEntities(hymn.title),
    scripture: scriptureRef,
    category: category,
    verse_count: verseCount,
    verses: Array.isArray(hymn.verses) && hymn.verses.length > 0 && !hymn.verses[0].includes('.verse:hover') ? hymn.verses : []
  };
});

fs.writeFileSync(hymnsFilePath, JSON.stringify(processedHymns, null, 2), 'utf8');

console.log(`✅ Cleaned ${processedHymns.length} hymns!`);
console.log(`  - Scripture references extracted: ${scriptureExtracted}`);
console.log(`  - Categories extracted: ${categoryExtracted}`);
