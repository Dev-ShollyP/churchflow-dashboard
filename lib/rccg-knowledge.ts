import hymnsData from './rccg-hymns.json';
import historyData from './rccg-history.json';

export interface Hymn {
  number: number;
  title: string;
  scripture?: string | null;
  category?: string | null;
  verse_count?: number | null;
  author?: string;
  verses: string[];
}

export function searchHymn(query: string): Hymn | null {
  if (!query) return null;
  const clean = query.trim().toLowerCase();

  // 1. Check for Hymn Number match (e.g., "hymn 1", "hymn #10", "100", "hymn no 12")
  const numMatch = clean.match(/hymn\s*(?:no\.?|#)?\s*(\d+)|^\s*(\d+)\s*$/i);
  if (numMatch) {
    const targetNum = parseInt(numMatch[1] || numMatch[2], 10);
    const found = hymnsData.find(h => h.number === targetNum);
    if (found) return found as Hymn;
  }

  // 2. Exact or substring match on title
  const foundByTitle = hymnsData.find(h =>
    h.title.toLowerCase().includes(clean) || clean.includes(h.title.toLowerCase())
  );
  if (foundByTitle) return foundByTitle as Hymn;

  // 3. Search verse content / lyrics if present
  const foundByVerses = hymnsData.find(h =>
    Array.isArray(h.verses) && (h.verses as string[]).some((v: string) => v.toLowerCase().includes(clean))
  );
  if (foundByVerses) return foundByVerses as Hymn;

  return null;
}

export function formatHymnResponse(hymn: Hymn): string {
  let output = `🎵 *RCCG HYMN ${hymn.number}: ${hymn.title}*\n`;
  if (hymn.category) {
    output += `🏷️ *Category*: ${hymn.category}\n`;
  }
  if (hymn.scripture) {
    output += `📖 *Scripture*: ${hymn.scripture}\n`;
  }
  output += `\n`;

  if (hymn.verses && hymn.verses.length > 0) {
    output += hymn.verses.map((v, i) => `*Verse ${i + 1}*\n${v}`).join('\n\n');
  } else {
    output += `_Official Entry in The Redeemed Hymnal (4th Edition), Hymn No. ${hymn.number}._\n\n` +
              `*(Lyrics for this specific title are pending full transcription in the web database. Please consult your physical RCCG Hymnal book for the printed score.)*`;
  }

  return output;
}

export function getRCCGInfo(query: string): string | null {
  const clean = query.trim().toLowerCase();

  if (/structure|hierarchy|administrative|organisat|organizat|zone|province|parish/i.test(clean)) {
    return `🏛️ *RCCG Administrative Structure & Hierarchy*:\n\n` +
      `The Redeemed Christian Church of God (RCCG) operates through a structured top-down administrative hierarchy from Global Headquarters down to local Parishes:\n\n` +
      `👑 *Apex Leadership*:\n` +
      `• *General Overseer (GO)*: Pastor E.A. Adeboye (Supreme spiritual & administrative leader worldwide)\n` +
      `• *Governing Council*: Highest policy-making body assisting the GO with governance, ordinations & discipline\n` +
      `• *World Advisory Council*: Global advisory body for international expansion\n\n` +
      `📐 *Administrative Hierarchy (Global → Local)*:\n` +
      `1. *Global Headquarters*: Redemption City, Mowe, Ogun State, Nigeria\n` +
      `2. *National / Country Office*: Oversees all regions in a host country (Country Coordinator)\n` +
      `3. *Region*: Clusters of provinces headed by a Regional Coordinator\n` +
      `4. *Province*: Managed by a Pastor in Charge of Province (PICP) & APICPs (Assistant Pastors in Charge of Province)\n` +
      `5. *Zone*: Group of Areas supervised by a Zonal Pastor (ZC)\n` +
      `6. *Area*: Group of Parishes supervised by an Area Pastor\n` +
      `7. *Parish*: Local assembly led by a Parish Pastor / Resident Pastor (e.g. RCCG Everflourishing Mega Sanctuary)\n` +
      `8. *House Fellowship / Cell*: Smallest unit (20-50 members) meeting weekly in homes for spiritual growth.`;
  }

  if (/vision|mission|goal/i.test(clean)) {
    return `📌 *RCCG Vision & Mission Statement*:\n\n${historyData.vision_and_mission.join('\n\n')}`;
  }

  if (/history|origin|founded|founder|akindayomi|adeboye/i.test(clean)) {
    return `📜 *RCCG History & Origin*:\n\n` +
      `• *Founded*: ${historyData.history.founded_year} by ${historyData.history.founder}\n` +
      `• *Origin*: ${historyData.history.origin_story}\n\n` +
      `• *Global Growth*: ${historyData.history.succession}`;
  }

  if (/doctrine|belief|faith|salvation|trinity|baptism|healing/i.test(clean)) {
    return `✝️ *RCCG Core Doctrines & Pillar Beliefs*:\n\n${historyData.doctrines_and_beliefs.join('\n\n')}`;
  }

  if (/leader|general overseer|g\.o\.|daddy g\.o\.|mummy g\.o\.|pastor adeboye|council|pastor in charge|zonal pastor|parish pastor|apicp|ebietomiye|ayobami/i.test(clean)) {
    return `👑 *RCCG Leadership & Governance*:\n\n` +
      `• *Founder*: ${historyData.leadership.founder}\n` +
      `• *General Overseer*: ${historyData.leadership.general_overseer}\n` +
      `• *Mother in Israel*: ${historyData.leadership.mother_in_israel}\n` +
      `• *Zonal Pastor (APICP)*: ${historyData.leadership.zonal_pastor}\n` +
      `• *Parish Pastor*: ${historyData.leadership.parish_pastor}\n` +
      `• *Assistant Ministers*: ${historyData.leadership.assistant_ministers}\n` +
      `• *Governing Council*: ${historyData.leadership.governing_council}`;
  }

  if (/program|convention|congress|holy ghost service|annual/i.test(clean)) {
    return `🗓️ *RCCG Major National & Global Programs*:\n\n${historyData.major_annual_programs.join('\n\n')}`;
  }

  if (/conduct|code of conduct|rules|values|holiness|worker|standard/i.test(clean)) {
    return `🛡️ *RCCG Code of Conduct & Core Values*:\n\n${historyData.code_of_conduct.join('\n\n')}`;
  }

  return null;
}

export function getHymnTotalCount(): number {
  return hymnsData.length;
}
