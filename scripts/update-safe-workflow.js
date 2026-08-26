const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '..', 'n8n-workflow-churchflow-fixed.json');
let workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Build 100% safe, error-free JavaScript code for "Build AI Context"
const safeBuildAiContextCode = `// Safe helper to get node data without crashing if not run in test mode
function safeAll(nodeName) {
  try { return $(nodeName).all(); } catch (e) { return []; }
}
function safeFirst(nodeName) {
  try { return $(nodeName).first().json; } catch (e) { return {}; }
}

const settingsItems = safeAll("Get Branch Settings");
const settings = settingsItems.length ? settingsItems[0].json : {};
const promptItems = safeAll("Get Active AI Prompt");
const prompt = promptItems.length ? promptItems[0].json : {};
const articleItems = safeAll("Get Knowledge Articles");
const articles = articleItems.map(function(i) { return i.json; }).slice(0, 5);

const parsed = safeFirst("Parse Incoming Message");
const userText = (parsed.text || '').trim();
const lowerText = userText.toLowerCase();
const buttonId = (parsed.button_id || '').trim();

const storageBase = 'https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers';

// ── KNOWN FLYER FALLBACKS ──
const KNOWN_FLYERS = [
  { match: 'digging deep', url: storageBase + '/Service/Digging%20Deep.png' },
  { match: 'faith clinic', url: storageBase + '/Service/faith%20clinic.jpg' },
  { match: 'youth vigil', url: storageBase + '/Service/Youth%20vigil.jpg' },
  { match: 'thanksgiving', url: storageBase + '/Service/Thanks.jpg' },
  { match: 'prayer sunday', url: storageBase + '/Service/Second%20Servivce.jpg' }
];

function cleanDescription(desc) {
  if (!desc) return '';
  return desc
    .replace(/\\[FLYER:\\s*[^\\]]+\\]/gi, '')
    .replace(/\\[IMAGE:\\s*[^\\]]+\\]/gi, '')
    .replace(/https?:\\/\\/[^\\s]+(?:supabase\\.co|storage)[^\\s]+\\.(?:png|jpe?g|webp|gif)/gi, '')
    .replace(/Flyer:\\s*https?:\\/\\/[^\\s]+/gi, '')
    .replace(/\\n{3,}/g, '\\n\\n')
    .trim();
}

function formatTime(t) {
  if (!t) return '';
  const parts = t.trim().split(':');
  let h = parseInt(parts[0], 10);
  if (isNaN(h)) return t;
  const m = parts[1] ? parts[1].padStart(2, '0') : '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + m + ' ' + ampm;
}

function formatTimeRange(start, end) {
  if (!start) return '';
  const s = formatTime(start);
  const e = end ? formatTime(end) : '';
  return e ? (s + ' – ' + e) : s;
}

function formatDatePretty(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr.slice(0, 10) + 'T00:00:00+01:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return isoStr;
  }
}

function resolveFlyer(item) {
  if (!item) return '';
  if (item.image_url) return item.image_url;
  if (item.flyer_url) return item.flyer_url;
  if (item.description) {
    const m = item.description.match(/\\[FLYER:\\s*([^\\s\\]]+)\\]/i) || item.description.match(/(https?:\\/\\/[^\\s]+\\.(?:png|jpe?g|webp))/i);
    if (m && m[1]) return m[1];
  }
  const t = (item.title || '').toLowerCase();
  for (const f of KNOWN_FLYERS) { if (t.includes(f.match)) return f.url; }
  return storageBase + '/Service/First%20Service.jpg';
}

function encourageLine() {
  const lines = [
    'Come expectant — God has something special for you! 🙌',
    'Don\\'t miss it — invite a friend and come be blessed! 🙏',
    'We\\'d love to see your face there. Come and encounter God! ✨',
    'This is your moment — come ready to receive! 🔥'
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

// ── CHURCH IDENTITY & LOCATION CONSTANTS ──
const CHURCH_NAME = 'RCCG Everflourishing Mega Sanctuary';
const CHURCH_ADDRESS = '7, Powerline Street, Moshalashi B/Stop, Iyana Iyesi, Ota, Ogun State';
const CHURCH_PLACE_ID = 'ChIJSSdhjOCZOxARPkC64JXJqks';
const CHURCH_MAPS_URL = 'https://maps.app.goo.gl/kCfijizViY9445b86';

// ── VERIFIED ANTHEMS & KEY HYMNS (100% Exact Lyrics) ──
const HYMNS_AND_ANTHEMS = {
  'rccg anthem': \`🎵 *RCCG ANTHEM*\\n\\n*Verse 1*\\nWe are Redeemites\\nUnited in love\\nJesus is for us\\nWe shall conquer\\n\\n*Verse 2*\\nWe are together\\nUnited in love\\nJesus is for us\\nWe shall conquer\\n\\n*Verse 3*\\nWe are victorious\\nUnited in love\\nJesus is for us\\nWe shall conquer\\n\\n*Verse 4*\\nCovenant children\\nUnited in love\\nJesus is for us\\nWe shall conquer\\n\\n*Verse 5*\\nHallelujah,\\nHallelujah\\nHallelujah Hallelujah\`,

  'house fellowship anthem': \`🎵 *RCCG HOUSE FELLOWSHIP ANTHEM*\\n\\n*Verse 1*\\nI love this family of God,\\nSo closely knitted into one,\\nThey have taken me into their arms\\nAnd am so glad to be\\nA part of this great family.\\n\\n*Verse 2*\\nI bless this family of God,\\nSo greatly prospered by the Lord,\\nThey have taken me into their arms\\nAnd am so glad to be\\nA part of this great family.\\n\\n*Verse 3*\\nI know this family of God,\\nSo deeply rooted in the word,\\nThey have taken me into their arms\\nAnd am so glad to be\\nA part of this great family.\\n\\n*Verse 4*\\nI see this family of God,\\nSo highly lifted above all,\\nThey have taken me into their arms\\nAnd am so glad to be\\nA part of this great family.\\n\\n*Verse 5*\\nCome, join this family of God,\\nSo highly favoured by the Lord,\\nThey have taken me into their arms\\nAnd am so glad to be\\nA part of this great family.\`,

  'sunday school anthem': \`🎵 *RCCG SUNDAY SCHOOL ANTHEM*\\n📖 *Scripture*: \\\"Study to shew thyself approved unto God.\\\" — 2 Timothy 2:15\\n\\n*Verse 1*\\nO Sunday School, on the Lord's day,\\nO how I love Thee well,\\nI am happy, it makes me glad\\nTo rejoice at Thy birth.\\n\\n*Verse 2*\\nO Sunday School, on the Lord's day,\\nThy friendship suits me well,\\nBoth young and old will sing Thy song,\\nWe long for Sunday School.\\n\\n*Verse 3*\\nO Sunday School, on the Lord's day,\\nChrist was Thy first teacher,\\nThe Holy Spirit, great teacher,\\nDoes manifest in thee.\\n\\n*Verse 4*\\nO Sunday School, on the Lord's day,\\nThis pledge we give today,\\nThat to God's word we will be true,\\nThrough Sunday School with love.\\n\\n*Verse 5*\\nO Sunday School, on the Lord's day,\\nThy counsel's so divine,\\nLead me to know the holy truth,\\nTill with my Lord I reign.\`
};

// ── 0. NON-FAITH / OFF-TOPIC GUARDRAIL (BEFORE AI NODE) ──
const nonFaithKeywords = /\\b(python|javascript|java\\b|c\\+\\+|coding|programming|write.*code|write.*script|write.*program|for loop|while loop|html|css|php|react|sql query|algorithm|binary search|recursion|homework|solve.*equation|crypto|bitcoin|forex|stock market|secular)\\b/i;
const isFaithQuery = /service|church|hymn|bible|scripture|prayer|pastor|rccg|jesus|god|fellowship|sunday|digging deep|faith clinic|giving|tithe|offering|testimony/i.test(lowerText);

if (nonFaithKeywords.test(lowerText) && !isFaithQuery) {
  const guardrailReply = 'I am EVF Bot, the official church assistant for *RCCG Everflourishing Mega Sanctuary* 🙏\\n\\n' +
    'I am dedicated exclusively to helping you with church services, upcoming programs, prayer requests, hymns, and spiritual guidance.\\n\\n' +
    'How may I assist you with our church services or prayers today? ✨';
  return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: guardrailReply } }];
}

// ── 1. CHECK FOR DIRECT HYMN/ANTHEM MATCH ──
if (lowerText.includes('sunday school') && (lowerText.includes('anthem') || lowerText.includes('lyrics') || lowerText.includes('song') || lowerText.includes('hymn'))) {
  return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: HYMNS_AND_ANTHEMS['sunday school anthem'] } }];
}
if (lowerText.includes('house fellowship') && (lowerText.includes('anthem') || lowerText.includes('song') || lowerText.includes('lyrics') || lowerText.includes('hymn') || lowerText.includes('family of god'))) {
  return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: HYMNS_AND_ANTHEMS['house fellowship anthem'] } }];
}
if ((lowerText.includes('redeem') || lowerText.includes('rccg')) && (lowerText.includes('anthem') || lowerText.includes('song') || lowerText.includes('lyrics') || lowerText.includes('hymn') || lowerText.includes('we are redeemites'))) {
  return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: HYMNS_AND_ANTHEMS['rccg anthem'] } }];
}
if (lowerText === 'rccg anthem' || lowerText === 'anthem' || lowerText === 'the rccg anthem' || lowerText === 'the anthem' || lowerText === 'redeem anthem') {
  return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: HYMNS_AND_ANTHEMS['rccg anthem'] } }];
}

// ── 1b. HYMN LOOKUP ──
function searchHymnDb(hymns, query) {
  if (!query) return null;
  const clean = query.trim().toLowerCase();

  const numMatch = clean.match(/hymn\\s*(?:no\\.?|#)?\\s*(\\d+)|^\\s*(\\d+)\\s*$/i);
  if (numMatch) {
    const targetNum = parseInt(numMatch[1] || numMatch[2], 10);
    const found = hymns.find(function(h) { return h.number === targetNum; });
    if (found) return found;
  }

  const foundByTitle = hymns.find(function(h) {
    return h.title && (h.title.toLowerCase().indexOf(clean) !== -1 || clean.indexOf(h.title.toLowerCase()) !== -1);
  });
  if (foundByTitle) return foundByTitle;

  const STOPWORDS = ['the','of','in','on','is','my','me','o','a','to','and','for','with','thy','thee','thou','i','am','be','we','are','all','from'];
  function normalizeWords(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9\\s]/g, '').split(/\\s+/).filter(function(w) { return w.length > 2 && STOPWORDS.indexOf(w) === -1; });
  }
  const cleanWords = normalizeWords(clean);
  let bestFuzzy = null;
  let bestScore = 0;
  hymns.forEach(function(h) {
    if (!h.title) return;
    const titleWords = normalizeWords(h.title);
    if (titleWords.length === 0) return;
    const overlap = titleWords.filter(function(w) { return cleanWords.indexOf(w) !== -1; }).length;
    const ratio = overlap / titleWords.length;
    if (overlap >= Math.min(2, titleWords.length) && ratio >= 0.5 && ratio > bestScore) {
      bestScore = ratio;
      bestFuzzy = h;
    }
  });
  if (bestFuzzy) return bestFuzzy;

  const foundByVerses = hymns.find(function(h) {
    return Array.isArray(h.verses) && h.verses.some(function(v) { return (v || '').toLowerCase().indexOf(clean) !== -1; });
  });
  if (foundByVerses) return foundByVerses;

  return null;
}

function formatHymnDbResponse(hymn) {
  let output = '🎵 *RCCG HYMN ' + hymn.number + ': ' + hymn.title + '*\\n';
  if (hymn.category) output += '🏷️ *Category*: ' + hymn.category + '\\n';
  if (hymn.scripture) output += '📖 *Scripture*: ' + hymn.scripture + '\\n';
  output += '\\n';

  let extractedRefrain = hymn.refrain || '';

  if (hymn.verses && hymn.verses.length > 0) {
    const cleanVerses = hymn.verses.map(function(v, i) {
      if (v.indexOf('[Refrain]') !== -1) {
        const parts = v.split('[Refrain]');
        if (!extractedRefrain && parts[1]) extractedRefrain = parts[1].trim();
        return '*Verse ' + (i + 1) + '*\\n' + parts[0].trim();
      }
      return '*Verse ' + (i + 1) + '*\\n' + v.trim();
    });
    output += cleanVerses.join('\\n\\n');
    if (extractedRefrain) output += '\\n\\n🔄 *Refrain / Chorus*:\\n_' + extractedRefrain + '_';
  } else {
    output += '_Official Entry in The Redeemed Hymnal (4th Edition), Hymn No. ' + hymn.number + '._\\n\\n' +
              '*(Lyrics for this title are printed in your physical RCCG Hymnal book.)*';
  }
  return output;
}

const hymnItems = safeAll("Fetch Hymn Match");
const builtInHymns = hymnItems.map(function(i) { return i.json; }).filter(function(h) { return h && h.number; });

const customHymnItems = safeAll("Fetch Custom Hymns");
const customHymnsDb = customHymnItems.map(function(i) { return i.json; }).filter(function(h) { return h && h.number; });

const hymnsDb = builtInHymns.concat(customHymnsDb);

const looksLikeHymnRequest = /hymn|lyrics|showers of blessing|blessed assurance/i.test(lowerText);

if (looksLikeHymnRequest && hymnsDb.length > 0) {
  let matchedHymn = searchHymnDb(hymnsDb, lowerText);

  if (!matchedHymn) {
    const recentItems = safeAll("Fetch Recent Messages");
    const recentMessages = recentItems.map(function(i) { return i.json; });
    const priorMemberTexts = recentMessages
      .filter(function(m) { return m && m.sender === 'member'; })
      .map(function(m) { return (m.message || '').toLowerCase(); });

    for (let i = 0; i < priorMemberTexts.length; i++) {
      const candidate = searchHymnDb(hymnsDb, priorMemberTexts[i]);
      if (candidate) { matchedHymn = candidate; break; }
    }
  }

  if (matchedHymn) {
    return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: formatHymnDbResponse(matchedHymn) } }];
  }
}

// ── 1c. LOCATION / DIRECTIONS INTERCEPT ──
if (buttonId === 'btn_location' || /location|address|where.*church|direction|find.*church|\\bmap\\b|navigate|\\bgps\\b|iyana iyesi|moshalashi|powerline|get to church/i.test(lowerText)) {
  const mapsNavUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(CHURCH_NAME) + '&destination_place_id=' + CHURCH_PLACE_ID;
  const mapsPinUrl = CHURCH_MAPS_URL;

  const locationReply = '📍 *' + CHURCH_NAME + '*\\n\\n' +
    '🏢 *Address*:\\n' + CHURCH_ADDRESS + '\\n\\n' +
    '🗺️ *Turn-by-turn Directions*:\\n' + mapsNavUrl + '\\n\\n' +
    '📌 *Map Pin*:\\n' + mapsPinUrl + '\\n\\n' +
    'God bless you as you come! We look forward to worshipping with you! 🙌';

  return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: locationReply } }];
}

// ── 2. FILTER RELEVANT UPCOMING EVENTS & PROGRAMS ──
const now = new Date();
const todayISO = now.toISOString().slice(0, 10);

const dbEventsItems = safeAll("Fetch Events");
const dbEvents = dbEventsItems
  .map(function(i) { return i.json; })
  .filter(function(e) { return e && (e.event_date >= todayISO || !e.event_date); })
  .slice(0, 5);

const specialProgramItems = safeAll("Fetch Special Programs");
const specialPrograms = specialProgramItems
  .map(function(i) { return i.json; })
  .filter(function(p) { return p && (p.program_date >= todayISO || !p.program_date); })
  .slice(0, 3);

// ── FLYER / PROGRAM DETAIL REQUEST ──
const flyerKeywords = /flyer|poster|picture|photo|image/i;
const detailKeywords = /details? of the program|more info on the program|tell me about the program|about the program/i;
if (flyerKeywords.test(lowerText) || detailKeywords.test(lowerText)) {
  const allPrograms = dbEvents.concat(specialPrograms);
  let matched = null;

  for (const p of allPrograms) {
    const titleWords = (p.title || '').toLowerCase().split(/\\s+/).filter(function(w) { return w.length > 3; });
    if (titleWords.some(function(w) { return lowerText.includes(w); })) { matched = p; break; }
  }

  if (!matched && allPrograms.length > 0) {
    matched = allPrograms[0];
  }

  if (matched) {
    const flyer = resolveFlyer(matched);
    const dateRaw = matched.event_date || matched.program_date || '';
    const dateStr = formatDatePretty(dateRaw) || dateRaw;
    const timeStr = formatTimeRange(matched.start_time, matched.end_time);
    const cleanDesc = cleanDescription(matched.description);

    let detailText = '📢 *' + (matched.title || 'Upcoming Program') + '*\\n\\n';
    if (dateStr) detailText += '📅 *Date*: ' + dateStr + '\\n';
    if (timeStr) detailText += '⏰ *Time*: ' + timeStr + '\\n';
    if (matched.location) detailText += '📍 *Location*: ' + matched.location + '\\n';
    if (cleanDesc) detailText += '\\n' + cleanDesc + '\\n';
    detailText += '\\n' + encourageLine();

    return [{ json: { is_direct: true, is_interactive: false, image_url: flyer, direct_reply: detailText } }];
  }
}

// ── \"WHAT'S ON TODAY / TOMORROW\" DETERMINISTIC INTERCEPT ──
const isTomorrowQuery = /tomorrow/i.test(lowerText);
const isTodayQuery = /what (program|service|event)s?.*(today|do you have today)|any program today|is there a program today|programs? today|service today|what.?s (on|happening) today/i.test(lowerText);

if (isTodayQuery || isTomorrowQuery) {
  const nowWAT = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
  if (isTomorrowQuery) {
    nowWAT.setDate(nowWAT.getDate() + 1);
  }
  const targetWeekday = nowWAT.getDay(); // 0=Sun, 2=Tue, 4=Thu
  const targetISO = nowWAT.toISOString().slice(0, 10);
  const targetDayLabel = isTomorrowQuery ? 'tomorrow' : 'today';

  const scheduledItems = [];

  if (targetWeekday === 0) scheduledItems.push({ title: 'Sunday Celebration Service', start_time: '08:00', end_time: '12:00', location: 'Main Sanctuary', description: 'Join us for a glorious time of praise, worship, and the uplifting Word of God.' });
  if (targetWeekday === 2) scheduledItems.push({ title: 'Digging Deep (Bible Study)', start_time: '18:00', end_time: '19:00', location: 'Main Sanctuary', description: 'A profound study into God\\'s Word to nourish and build your spiritual foundation.' });
  if (targetWeekday === 4) scheduledItems.push({ title: 'Faith Clinic (Prayer & Deliverance)', start_time: '18:00', end_time: '19:00', location: 'Main Sanctuary', description: 'A dedicated hour of warfare prayers, healing, deliverance, and breakthroughs.' });

  const matchedSpecial = dbEvents.concat(specialPrograms).filter(function(p) {
    const d = p.event_date || p.program_date;
    return d === targetISO;
  });
  scheduledItems.push.apply(scheduledItems, matchedSpecial);

  let replyText = '';
  let flyer = '';
  if (scheduledItems.length === 0) {
    replyText = 'We have no regular service or special program scheduled for ' + targetDayLabel + '.\\n\\nFeel free to type *service times* to see our full weekly schedule, or ask about upcoming programs!';
  } else {
    replyText = scheduledItems.map(function(p) {
      const t = formatTimeRange(p.start_time, p.end_time);
      let block = '🗓️ *' + (p.title || 'Church Program') + '*';
      if (t) block += '\\n⏰ *Time*: ' + t;
      if (p.location) block += '\\n📍 *Location*: ' + p.location;
      const desc = cleanDescription(p.description);
      if (desc) block += '\\n\\n' + desc;
      return block;
    }).join('\\n\\n───────────────────\\n\\n') + '\\n\\n' + encourageLine();

    if (scheduledItems.length === 1) {
      flyer = resolveFlyer(scheduledItems[0]);
    }
  }
  return [{ json: { is_direct: true, is_interactive: false, image_url: flyer, direct_reply: replyText } }];
}

// ── 3. SERVICE TIMES QUICK REPLY ──
if (buttonId === 'btn_services' || lowerText === 'service times' || lowerText === 'service schedule' || lowerText === 'when is service' || lowerText === 'services') {
  let scheduleText = '🏛️ *RCCG EVERFLOURISHING MEGA SANCTUARY*\\n\\n' +
    '*Weekly Service Schedule*:\\n' +
    '• *Sundays*: 1st Service @ 8:00 AM | Sunday School @ 9:45 AM | 2nd Service @ 10:15 AM\\n' +
    '• *Tuesdays (Digging Deep)*: 6:00 PM – 7:00 PM\\n' +
    '• *Thursdays (Faith Clinic)*: 6:00 PM – 7:00 PM\\n\\n' +
    '📍 *Location*: Main Sanctuary\\n' + CHURCH_ADDRESS + '\\n\\n' +
    '_We would love to have you fellowship with us!_ 🙏';
  return [{ json: { is_direct: true, is_interactive: false, image_url: storageBase + '/Service/First%20Service.jpg', direct_reply: scheduleText } }];
}

// ── 4. GIVING & TITHES INTENT ──
if (buttonId === 'btn_giving' || lowerText === 'tithe' || lowerText === 'offering' || lowerText === 'account number' || lowerText === 'how to give' || lowerText === 'giving') {
  const replyText = '💳 *CHURCH GIVING & TITHES*\\n\\n' +
    '🏛️ *Tithe & Offering Account*\\n' +
    '• *Bank*: Access Bank\\n' +
    '• *Account Number*: 0695126926\\n' +
    '• *Account Name*: RCCG Everflourishing Parish\\n\\n' +
    '🏗️ *Building Project Account*\\n' +
    '• *Bank*: United Bank for Africa (UBA)\\n' +
    '• *Account Number*: 1028494770\\n' +
    '• *Account Name*: RCCG EVERFLOURISHING PROJECT\\n\\n' +
    '_God bless you abundantly as you give to His work!_ ✨';
  return [{ json: { is_direct: true, is_interactive: false, image_url: storageBase + '/Giving/Offering.png', direct_reply: replyText } }];
}

// ── 4b. FIRST TIMER / I'M NEW HERE FLOW (Exact Design & Content) ──
if (
  buttonId === 'btn_first_timer' ||
  lowerText === \"i'm new here\" ||
  lowerText === 'i am new here' ||
  lowerText === 'im new here' ||
  lowerText === 'new here' ||
  lowerText === 'first timer' ||
  lowerText === 'first time' ||
  lowerText === 'i am a first timer' ||
  lowerText === 'im a first timer' ||
  lowerText.includes('first time visiting') ||
  lowerText.includes('new member')
) {
  const firstTimerReply = '🎉 *WELCOME TO RCCG EVERFLOURISHING MEGA SANCTUARY!* 🎉\\n\\n' +
    'We are overjoyed to have you join us! At EVF Sanctuary, you are family, and we believe God brought you here for a glorious purpose.\\n\\n' +
    '✨ *Our Weekly Services*:\\n' +
    '• *Sundays*: 1st Service @ 8:00 AM | Sunday School @ 9:45 AM | 2nd Service @ 10:15 AM\\n' +
    '• *Tuesdays (Digging Deep)*: 6:00 PM – 7:00 PM\\n' +
    '• *Thursdays (Faith Clinic)*: 6:00 PM – 7:00 PM\\n\\n' +
    '📍 *Location*: Main Sanctuary\\n' +
    CHURCH_ADDRESS + '\\n\\n' +
    'We would love to get to know you better! Please reply to us with:\\n' +
    '1️⃣ *Your Full Name*\\n' +
    '2️⃣ *Your Residential Location/Area*\\n' +
    '3️⃣ *Any Prayer Request you would like us to pray for*\\n\\n' +
    'God bless you richly! 🙏';

  return [{
    json: {
      is_direct: true,
      is_interactive: false,
      image_url: storageBase + '/Service/First%20Service.jpg',
      direct_reply: firstTimerReply
    }
  }];
}

// ── 5. GREETINGS & MENU ──
const isGreeting = ['hi', 'hello', 'hey', 'menu', 'start'].indexOf(lowerText) !== -1;
if (isGreeting || buttonId === 'btn_menu') {
  return [{
    json: {
      is_direct: false,
      is_interactive: true,
      interactive_payload: {
        messaging_product: 'whatsapp',
        to: parsed.from_phone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: 'Welcome to RCCG Everflourishing Mega Sanctuary! 🙏\\n\\nHow may we assist you today? Tap an option below, or feel free to type your question.' },
          footer: { text: 'RCCG EVF Sanctuary' },
          action: {
            buttons: [
              { type: 'reply', reply: { id: 'btn_services', title: 'Service Times' } },
              { type: 'reply', reply: { id: 'btn_giving', title: 'Giving & Tithes' } },
              { type: 'reply', reply: { id: 'btn_first_timer', title: \"I'm New Here\" } }
            ]
          }
        }
      }
    }
  }];
}

// ── 6. BUILD STRICTLY FAITH-BASED AI CONTEXT ──
const watTime = now.toLocaleString('en-US', {
  timeZone: 'Africa/Lagos',
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
});

const specialProgramsBlock = specialPrograms
  .map(function(p) {
    const t = formatTimeRange(p.start_time, p.end_time);
    const d = cleanDescription(p.description);
    return '- ' + (p.title || '') + ' | Date: ' + (p.program_date || '') + (t ? (' | Time: ' + t) : '') + (d ? (' | Details: ' + d) : '');
  })
  .join('\\n');

const eventsBlock = dbEvents
  .map(function(e) {
    const t = formatTimeRange(e.start_time, e.end_time);
    const d = cleanDescription(e.description);
    return '- ' + (e.title || '') + ' | Date: ' + (e.event_date || '') + (t ? (' | Time: ' + t) : '') + (d ? (' | Details: ' + d) : '');
  })
  .join('\\n');

const knowledgeBlock = articles
  .map(function(a) { return '• ' + a.title + ': ' + (a.markdown || '').slice(0, 300); })
  .join('\\n');

const systemPrompt = \`You are EVF Bot, the official, strictly faith-focused WhatsApp assistant for RCCG Everflourishing Mega Sanctuary.

CURRENT TIME (WAT): \${watTime}
CHURCH ADDRESS: \${CHURCH_ADDRESS}

UPCOMING SPECIAL PROGRAMS:
\${specialProgramsBlock || 'None scheduled currently'}

REGULAR WEEKLY SERVICES:
- Sundays: 1st Service (8:00 AM), Sunday School (9:45 AM), 2nd Service (10:15 AM)
- Tuesdays (Digging Deep Bible Study): 6:00 PM – 7:00 PM
- Thursdays (Faith Clinic Miracle & Deliverance): 6:00 PM – 7:00 PM

KNOWLEDGE HIGHLIGHTS:
\${knowledgeBlock}

CORE INSTRUCTIONS & STRICT BOUNDARIES:
1. STRICTLY CHURCH & FAITH SCOPE: You ONLY answer questions regarding RCCG Everflourishing church events, service times, location/directions, giving, pastorate, Christian doctrine, Bible scriptures, prayers, hymns, and spiritual counseling.
2. REFUSE ALL SECULAR / OFF-TOPIC QUESTIONS: If the user asks about programming, coding (Python, JavaScript, etc.), mathematics, school homework, secular politics, secular news, entertainment, cryptocurrency, or non-church topics, you MUST POLITELY REFUSE.
Example Refusal:
"I am EVF Bot, the assistant for RCCG Everflourishing Mega Sanctuary 🙏 I can only help you with church services, upcoming programs, prayer requests, hymns, and spiritual guidance. How can I assist you with our church today?"
3. NEVER WRITE CODE OR DISCUSS COMPUTER PROGRAMMING: Under NO circumstances should you output code, loops, programming scripts, or technical tutorials.
4. FIRST TIMERS: When a visitor introduces themselves, shares their full name, or residential location, warmly welcome them as family and let them know the pastoral team is praying for them.
5. FORMATTING: Use single asterisks for *bold*. Never use double asterisks (**bold**). No markdown headers (###). Never output raw URLs or [FLYER:...] tags. Keep answers warm, encouraging, concise, and scriptural.\`;

return [{
  json: {
    is_direct: false,
    is_interactive: false,
    system_prompt: systemPrompt,
    user_message: userText
  }
}];`;

// Update node in workflow
const buildAiNode = workflow.nodes.find(n => n.name === 'Build AI Context');
if (buildAiNode && buildAiNode.parameters) {
  buildAiNode.parameters.jsCode = safeBuildAiContextCode;
}

fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log('Successfully written safe Build AI Context node code!');
