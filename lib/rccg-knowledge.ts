import hymnsData from './rccg-hymns.json';
import historyData from './rccg-history.json';
import { getServiceScheduleInfo } from './services';

export interface Hymn {
  number: number;
  title: string;
  scripture?: string | null;
  category?: string | null;
  verse_count?: number | null;
  author?: string;
  verses: string[];
  refrain?: string;
}

export function searchHymn(query: string): Hymn | null {
  if (!query) return null;
  const clean = query.trim().toLowerCase();

  // 1. Check for Anthem queries
  if (clean.includes('sunday school') && (clean.includes('anthem') || clean.includes('hymn') || clean.includes('lyrics') || clean.includes('song'))) {
    const found = hymnsData.find(h => h.title.toLowerCase().includes('sunday school anthem'));
    if (found) return found as Hymn;
  }
  if ((clean.includes('redeem') || clean.includes('rccg')) && (clean.includes('anthem') || clean.includes('song'))) {
    const found = hymnsData.find(h => h.title.toLowerCase().includes('rccg anthem'));
    if (found) return found as Hymn;
  }
  if (clean.includes('house fellowship') && (clean.includes('anthem') || clean.includes('song'))) {
    const found = hymnsData.find(h => h.title.toLowerCase().includes('house fellowship anthem'));
    if (found) return found as Hymn;
  }

  // 2. Check by Hymn Number (e.g., "hymn 235", "235", "hymn #20")
  const numMatch = clean.match(/hymn\s*(?:no\.?|#)?\s*(\d+)|^\s*(\d+)\s*$/i);
  if (numMatch) {
    const targetNum = parseInt(numMatch[1] || numMatch[2], 10);
    const found = hymnsData.find(h => h.number === targetNum);
    if (found) return found as Hymn;
  }

  // 3. Search exact/substring title match
  const foundByTitle = hymnsData.find(h =>
    h.title.toLowerCase().includes(clean) || clean.includes(h.title.toLowerCase())
  );
  if (foundByTitle) return foundByTitle as Hymn;

  // 4. Search verse content / lyrics
  const foundByVerses = hymnsData.find(h =>
    Array.isArray(h.verses) && (h.verses as string[]).some((v: string) => v.toLowerCase().includes(clean))
  );
  if (foundByVerses) return foundByVerses as Hymn;

  return null;
}

export function formatHymnResponse(hymn: Hymn): string {
  const isAnthem = hymn.category === 'ANTHEM';
  let output = isAnthem ? `🎵 *${hymn.title.toUpperCase()}*\n` : `🎵 *RCCG HYMN ${hymn.number}: ${hymn.title}*\n`;
  if (hymn.category && !isAnthem) {
    output += `🏷️ *Category*: ${hymn.category}\n`;
  }
  if (hymn.scripture) {
    output += `📖 *Scripture*: ${hymn.scripture}\n`;
  }
  output += `\n`;

  let extractedRefrain = hymn.refrain || '';

  if (hymn.verses && hymn.verses.length > 0) {
    const cleanVerses = hymn.verses.map((v, i) => {
      if (v.includes('[Refrain]')) {
        const parts = v.split('[Refrain]');
        if (!extractedRefrain && parts[1]) {
          extractedRefrain = parts[1].trim();
        }
        return `*Verse ${i + 1}*\n${parts[0].trim()}`;
      }
      return isAnthem && hymn.verses.length === 1 ? v.trim() : `*Verse ${i + 1}*\n${v.trim()}`;
    });

    output += cleanVerses.join('\n\n');

    if (extractedRefrain) {
      output += `\n\n🔁 *Refrain / Chorus*:\n_${extractedRefrain}_`;
    }
  } else {
    output += `_Official Entry in The Redeemed Hymnal (4th Edition), Hymn No. ${hymn.number}._\n\n` +
              `*(Lyrics for this title are printed in your physical RCCG Hymnal book.)*`;
  }

  return output;
}

/**
 * Returns Google Maps Realtime Location & Live Navigation Links
 */
export function getChurchLocationAndDirections(userQuery: string = ''): string {
  return (
    `📍 *RCCG Everflourishing Mega Sanctuary*\n\n` +
    `🏢 *Physical Address*:\n` +
    `No. 7, Powerline Street, Moshalashi Bus Stop, Iyana Iyesi, Ota, Ogun State, Nigeria.\n\n` +
    `🗺️ *Live Google Maps Navigation*:\n` +
    `👉 https://www.google.com.ng/maps/dir//RCCG+Everflourishing+Mega+Sanctuary,+7+Powerline+Street,+Iyana+Iyesi,+Ado+Odo%2FOta+112226,+Ogun+State/@6.6819397,3.1856563,17z\n\n` +
    `📌 *Google Maps Location Pin*:\n` +
    `https://maps.google.com/?q=6.6819397,3.1856563\n\n` +
    `God bless you as you come! We look forward to worshipping with you! 🙌`
  );
}

export function getRCCGInfo(query: string): string | null {
  const clean = query.trim().toLowerCase();

  // Hymn search query
  if (/hymn|showers of blessing|blessed assurance|song|lyrics|sing/i.test(clean)) {
    const found = searchHymn(clean);
    if (found) return formatHymnResponse(found);
  }

  // Location / Directions query -> Google Maps
  if (/location|address|where|direction|find|map|ojuore|kola|iyana iyesi|moshalashi|powerline|get to church|navigate|gps/i.test(clean)) {
    return getChurchLocationAndDirections(query);
  }

  // Service Time / Schedule query
  if (/service|time|digging deep|faith clinic|sunday|schedule|tomorrow|today|when|next service/i.test(clean)) {
    return getServiceScheduleInfo();
  }

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
