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
}

export function searchHymn(query: string): Hymn | null {
  if (!query) return null;
  const clean = query.trim().toLowerCase();

  const numMatch = clean.match(/hymn\s*(?:no\.?|#)?\s*(\d+)|^\s*(\d+)\s*$/i);
  if (numMatch) {
    const targetNum = parseInt(numMatch[1] || numMatch[2], 10);
    const found = hymnsData.find(h => h.number === targetNum);
    if (found) return found as Hymn;
  }

  const foundByTitle = hymnsData.find(h =>
    h.title.toLowerCase().includes(clean) || clean.includes(h.title.toLowerCase())
  );
  if (foundByTitle) return foundByTitle as Hymn;

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

/**
 * Returns Google Maps Realtime Location & Directions info
 */
export function getChurchLocationAndDirections(userQuery: string = ''): string {
  const clean = userQuery.toLowerCase();
  let landmarkContext = '';

  if (clean.includes('kola') || clean.includes('lagos') || clean.includes('abule egba')) {
    landmarkContext =
      `🚗 *Directions from Kola Bus Stop / Lagos*:\n` +
      `1. Take a bus or taxi from Kola Bus Stop heading towards Ota / Sango-Ota.\n` +
      `2. Alight at *Iyana Iyesi Bus Stop* (just after Moshalashi).\n` +
      `3. From Iyana Iyesi B/Stop, walk down or take a short tricycle (keke) down *Powerline Street* to No. 7.\n` +
      `⏱️ Estimated travel time: 25 - 40 mins depending on traffic.\n\n`;
  } else if (clean.includes('sango') || clean.includes('abeokuta')) {
    landmarkContext =
      `🚗 *Directions from Sango / Abeokuta Road*:\n` +
      `1. Take a bus or tricycle heading towards Iyana Iyesi / Toll Gate.\n` +
      `2. Alight at *Moshalashi / Iyana Iyesi Bus Stop*.\n` +
      `3. Turn into *Powerline Street* to arrive at RCCG Everflourishing Mega Sanctuary (No. 7).\n\n`;
  }

  return (
    `📍 *RCCG Everflourishing Mega Sanctuary — Location & Directions*\n\n` +
    `🏢 *Physical Address*:\n` +
    `7, Powerline Street, Moshalashi Bus Stop, Iyana Iyesi, Ota, Ogun State, Nigeria.\n\n` +
    landmarkContext +
    `🗺️ *Realtime Google Maps Navigation*:\n` +
    `• *Open Pin on Google Maps*:\nhttps://maps.google.com/?q=RCCG+Everflourishing+Mega+Sanctuary+Powerline+Street+Iyana+Iyesi+Ota\n\n` +
    `🧭 *Live GPS Directions Link*:\n` +
    `https://www.google.com/maps/dir/?api=1&destination=6.6961,3.2162&destination_place_id=RCCG+Everflourishing+Mega+Sanctuary\n\n` +
    `God bless you as you come! We look forward to worshipping with you! 🙌`
  );
}

export function getRCCGInfo(query: string): string | null {
  const clean = query.trim().toLowerCase();

  // Location / Directions query
  if (/location|address|where|direction|find|map|kola|iyana iyesi|moshalashi|powerline|get to church/i.test(clean)) {
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
