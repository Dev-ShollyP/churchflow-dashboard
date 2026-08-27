const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '..', 'n8n-workflow-churchflow-fixed.json');
let workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// 1. Build the updated nodes list
// Let's find existing nodes or create new ones
const nodeMap = {};
workflow.nodes.forEach(n => { nodeMap[n.name] = n; });

// ── Node: Fetch Recent Messages ──
const fetchRecentMessagesNode = {
  parameters: {
    url: "={{$vars.SUPABASE_URL}}/rest/v1/messages",
    sendQuery: true,
    queryParameters: {
      parameters: [
        {
          name: "conversation_id",
          value: "=eq.{{$(\"Resolve conversation_id\").first().json.conversation_id}}"
        },
        {
          name: "order",
          value: "created_at.desc"
        },
        {
          name: "limit",
          value: "8"
        },
        {
          name: "select",
          value: "sender,message,created_at"
        }
      ]
    },
    sendHeaders: true,
    headerParameters: {
      parameters: [
        {
          name: "apikey",
          value: "={{$vars.SUPABASE_SERVICE_KEY}}"
        },
        {
          name: "Authorization",
          value: "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
        }
      ]
    },
    options: {}
  },
  id: "f4a1892c-e123-4485-9940-fetchrecentmsg",
  name: "Fetch Recent Messages",
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.2,
  position: [9488, 2400],
  alwaysOutputData: true
};

// ── Node: Has Incoming Image? ──
const hasIncomingImageNode = {
  parameters: {
    conditions: {
      options: {
        caseSensitive: true,
        leftValue: "",
        typeValidation: "strict",
        version: 1
      },
      conditions: [
        {
          leftValue: "={{ $(\"Parse Incoming Message\").first().json.media_id }}",
          rightValue: "",
          operator: {
            type: "string",
            operation: "notEmpty"
          }
        }
      ],
      combinator: "and"
    },
    options: {}
  },
  id: "d19284fa-b231-4198-9940-hasincomingimg",
  name: "Has Incoming Image?",
  type: "n8n-nodes-base.if",
  typeVersion: 2,
  position: [9712, 2400]
};

// ── Node: Get WhatsApp Media URL ──
const getMediaUrlNode = {
  parameters: {
    url: "=https://graph.facebook.com/v20.0/{{ $(\"Parse Incoming Message\").first().json.media_id }}",
    sendHeaders: true,
    headerParameters: {
      parameters: [
        {
          name: "Authorization",
          value: "=Bearer {{$vars.WHATSAPP_ACCESS_TOKEN}}"
        }
      ]
    },
    options: {}
  },
  id: "8c91a02b-1192-4821-9940-getmediaurl",
  name: "Get WhatsApp Media URL",
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.2,
  position: [9936, 2200],
  onError: "continueRegularOutput"
};

// ── Node: Download WhatsApp Media ──
const downloadMediaNode = {
  parameters: {
    url: "={{ $json.url }}",
    sendHeaders: true,
    headerParameters: {
      parameters: [
        {
          name: "Authorization",
          value: "=Bearer {{$vars.WHATSAPP_ACCESS_TOKEN}}"
        }
      ]
    },
    options: {
      response: {
        response: {
          responseFormat: "file"
        }
      }
    }
  },
  id: "6a82b93c-4412-4912-9940-downloadmedia",
  name: "Download WhatsApp Media",
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.2,
  position: [10160, 2200],
  onError: "continueRegularOutput"
};

// ── Node: Encode Image Base64 ──
const encodeImageNode = {
  parameters: {
    jsCode: `let imageBase64 = '';
try {
  const binaryData = $input.first().binary?.data;
  if (binaryData && binaryData.data) {
    const mime = binaryData.mimeType || 'image/jpeg';
    imageBase64 = 'data:' + mime + ';base64,' + binaryData.data;
  }
} catch (e) {}

return [{ json: { image_base64_url: imageBase64 } }];`
  },
  id: "3b91a74d-9912-4721-9940-encodeimageb64",
  name: "Encode Image Base64",
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: [10384, 2200]
};

// ── Updated: Build AI Context JS Code ──
const buildAiContextJs = `// Safe helpers
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
const hasMedia = Boolean(parsed.media_id);

// Check if an encoded image exists
let incomingImageBase64 = '';
const encodeItems = safeAll("Encode Image Base64");
if (encodeItems.length && encodeItems[0].json && encodeItems[0].json.image_base64_url) {
  incomingImageBase64 = encodeItems[0].json.image_base64_url;
}

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

const CHURCH_NAME = 'RCCG Everflourishing Mega Sanctuary';
const CHURCH_ADDRESS = '7, Powerline Street, Moshalashi B/Stop, Iyana Iyesi, Ota, Ogun State';
const CHURCH_PLACE_ID = 'ChIJSSdhjOCZOxARPkC64JXJqks';
const CHURCH_MAPS_URL = 'https://maps.app.goo.gl/kCfijizViY9445b86';

// ── 0. NON-FAITH / OFF-TOPIC GUARDRAIL (BEFORE AI NODE) ──
const nonFaithKeywords = /\\b(python|javascript|java\\b|c\\+\\+|coding|programming|write.*code|write.*script|write.*program|for loop|while loop|html|css|php|react|sql query|algorithm|binary search|recursion|homework|solve.*equation|crypto|bitcoin|forex|stock market|secular)\\b/i;
const isFaithQuery = /service|church|hymn|bible|scripture|prayer|pastor|rccg|jesus|god|fellowship|sunday|digging deep|faith clinic|giving|tithe|offering|testimony|quiz/i.test(lowerText);

if (nonFaithKeywords.test(lowerText) && !isFaithQuery && !hasMedia) {
  const guardrailReply = 'I am EVF Bot, the official church assistant for *RCCG Everflourishing Mega Sanctuary* 🙏\\n\\n' +
    'I am dedicated exclusively to helping you with church services, upcoming programs, prayer requests, hymns, and spiritual guidance.\\n\\n' +
    'How may I assist you with our church services or prayers today? ✨';
  return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: guardrailReply } }];
}

// ── 1. CHECK FOR DIRECT HYMN/ANTHEM MATCH ──
const HYMNS_AND_ANTHEMS = {
  'rccg anthem': \`🎵 *RCCG ANTHEM*\\n\\n*Verse 1*\\nWe are Redeemites\\nUnited in love\\nJesus is for us\\nWe shall conquer\\n\\n*Verse 2*\\nWe are together\\nUnited in love\\nJesus is for us\\nWe shall conquer\\n\\n*Verse 3*\\nWe are victorious\\nUnited in love\\nJesus is for us\\nWe shall conquer\\n\\n*Verse 4*\\nCovenant children\\nUnited in love\\nJesus is for us\\nWe shall conquer\\n\\n*Verse 5*\\nHallelujah,\\nHallelujah\\nHallelujah Hallelujah\`,
  'house fellowship anthem': \`🎵 *RCCG HOUSE FELLOWSHIP ANTHEM*\\n\\n*Verse 1*\\nI love this family of God,\\nSo closely knitted into one,\\nThey have taken me into their arms\\nAnd am so glad to be\\nA part of this great family.\\n\\n*Verse 2*\\nI bless this family of God,\\nSo greatly prospered by the Lord,\\nThey have taken me into their arms\\nAnd am so glad to be\\nA part of this great family.\\n\\n*Verse 3*\\nI know this family of God,\\nSo deeply rooted in the word,\\nThey have taken me into their arms\\nAnd am so glad to be\\nA part of this great family.\\n\\n*Verse 4*\\nI see this family of God,\\nSo highly lifted above all,\\nThey have taken me into their arms\\nAnd am so glad to be\\nA part of this great family.\\n\\n*Verse 5*\\nCome, join this family of God,\\nSo highly favoured by the Lord,\\nThey have taken me into their arms\\nAnd am so glad to be\\nA part of this great family.\`,
  'sunday school anthem': \`🎵 *RCCG SUNDAY SCHOOL ANTHEM*\\n📖 *Scripture*: \\\"Study to shew thyself approved unto God.\\\" — 2 Timothy 2:15\\n\\n*Verse 1*\\nO Sunday School, on the Lord's day,\\nO how I love Thee well,\\nI am happy, it makes me glad\\nTo rejoice at Thy birth.\\n\\n*Verse 2*\\nO Sunday School, on the Lord's day,\\nThy friendship suits me well,\\nBoth young and old will sing Thy song,\\nWe long for Sunday School.\\n\\n*Verse 3*\\nO Sunday School, on the Lord's day,\\nChrist was Thy first teacher,\\nThe Holy Spirit, great teacher,\\nDoes manifest in thee.\\n\\n*Verse 4*\\nO Sunday School, on the Lord's day,\\nThis pledge we give today,\\nThat to God's word we will be true,\\nThrough Sunday School with love.\\n\\n*Verse 5*\\nO Sunday School, on the Lord's day,\\nThy counsel's so divine,\\nLead me to know the holy truth,\\nTill with my Lord I reign.\`
};

if (!hasMedia) {
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
}

// ── 1c. LOCATION / DIRECTIONS INTERCEPT ──
if (buttonId === 'btn_location' || (!hasMedia && /^(location|address|where is church|direction|find church|map|gps)$/i.test(lowerText))) {
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

// ── FLYER / PROGRAM DETAIL REQUEST (Only if user did NOT upload an image) ──
if (!hasMedia && !incomingImageBase64) {
  const flyerKeywords = /flyer|poster|picture|photo/i;
  const detailKeywords = /details? of the program|more info on the program|tell me about the program|about the program/i;
  if (flyerKeywords.test(lowerText) || detailKeywords.test(lowerText)) {
    const allPrograms = dbEvents.concat(specialPrograms);
    let matched = null;

    for (const p of allPrograms) {
      const titleWords = (p.title || '').toLowerCase().split(/\\s+/).filter(function(w) { return w.length > 3; });
      if (titleWords.some(function(w) { return lowerText.includes(w); })) { matched = p; break; }
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
}

// ── 3. SERVICE TIMES QUICK REPLY ──
if (buttonId === 'btn_services' || (!hasMedia && (lowerText === 'service times' || lowerText === 'service schedule' || lowerText === 'when is service' || lowerText === 'services'))) {
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
if (buttonId === 'btn_giving' || (!hasMedia && (lowerText === 'tithe' || lowerText === 'offering' || lowerText === 'account number' || lowerText === 'how to give' || lowerText === 'giving'))) {
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

// ── 4b. FIRST TIMER / I'M NEW HERE FLOW ──
if (
  buttonId === 'btn_first_timer' ||
  (!hasMedia && (
    lowerText === \"i'm new here\" ||
    lowerText === 'i am new here' ||
    lowerText === 'im new here' ||
    lowerText === 'new here' ||
    lowerText === 'first timer' ||
    lowerText === 'first time'
  ))
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
if (!hasMedia && (isGreeting || buttonId === 'btn_menu')) {
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

// ── 6. BUILD STRICTLY FAITH-BASED AI CONTEXT WITH MEMORY & VISION ──
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
1. CONVERSATION CONTEXT & QUIZ MEMORY:
   - Always read and follow the full conversation history.
   - If you previously asked a Bible Quiz question or trivia, evaluate the user's answer directly (e.g. if they say "Noah", tell them they are correct! 🎉 and give the next question or score).
   - DO NOT confuse a quiz answer like "Noah" or short answers with someone introducing their name as a new visitor!
2. READING IMAGES & FLYERS:
   - If an image or flyer is attached to the user's message, carefully read and examine the text on the flyer (dates, themes, venue, speakers, RCCG convention/congress details) and answer the user's questions about that specific flyer accurately.
3. STRICTLY CHURCH & FAITH SCOPE: You ONLY answer questions regarding RCCG church events, service times, location/directions, giving, pastorate, Christian doctrine, Bible scriptures, prayers, hymns, and spiritual counseling.
4. REFUSE ALL SECULAR / OFF-TOPIC QUESTIONS: If the user asks about programming, coding (Python, JavaScript, etc.), mathematics, school homework, secular politics, secular news, entertainment, cryptocurrency, or non-church topics, you MUST POLITELY REFUSE.
5. FIRST TIMERS: Only when a user explicitly introduces themselves as a first-time visitor or gives their name/area in response to the welcome prompt, warmly welcome them as family.
6. FORMATTING: Use single asterisks for *bold*. Never use double asterisks (**bold**). No markdown headers (###). Never output raw URLs or [FLYER:...] tags. Keep answers warm, encouraging, concise, and scriptural.\`;

// ── ASSEMBLE OPENAI MESSAGES ARRAY (WITH HISTORY & VISION) ──
const rawHistory = safeAll("Fetch Recent Messages").map(function(i) { return i.json; });
// Sort ascending by time
rawHistory.sort(function(a, b) {
  return new Date(a.created_at || 0) - new Date(b.created_at || 0);
});

// Take the last 6 messages excluding the current one if already saved
const historyMessages = [];
rawHistory.forEach(function(m) {
  if (m && m.message && m.message.trim() !== '') {
    const role = (m.sender === 'member') ? 'user' : 'assistant';
    historyMessages.push({ role: role, content: m.message });
  }
});

// Build latest user turn (with image vision payload if present)
let latestUserContent;
if (incomingImageBase64) {
  latestUserContent = [
    {
      type: "text",
      text: userText || "Please read and explain the details from this church flyer/image."
    },
    {
      type: "image_url",
      image_url: {
        url: incomingImageBase64
      }
    }
  ];
} else {
  latestUserContent = userText || "Hello";
}

// Assemble final messages payload
const openAiMessages = [
  { role: "system", content: systemPrompt }
];

// Append recent history (up to last 5 history items)
const recentSlice = historyMessages.slice(-5);
recentSlice.forEach(function(h) {
  openAiMessages.push(h);
});

// If the latest message is not already the last history item, append it
const lastHistory = recentSlice.length ? recentSlice[recentSlice.length - 1] : null;
if (!lastHistory || lastHistory.role !== 'user' || lastHistory.content !== userText || incomingImageBase64) {
  openAiMessages.push({ role: "user", content: latestUserContent });
}

return [{
  json: {
    is_direct: false,
    is_interactive: false,
    system_prompt: systemPrompt,
    user_message: userText,
    messages: openAiMessages
  }
}];`;

// ── Update Call AI (OpenAI) to use gpt-4o-mini and pass the full messages array ──
const callAiNode = {
  parameters: {
    method: "POST",
    url: "https://api.openai.com/v1/chat/completions",
    sendHeaders: true,
    headerParameters: {
      parameters: [
        {
          name: "Authorization",
          value: "=Bearer {{$vars.OPENAI_API_KEY}}"
        },
        {
          name: "Content-Type",
          value: "application/json"
        }
      ]
    },
    sendBody: true,
    specifyBody: "json",
    jsonBody: "={\n  \"model\": \"gpt-4o-mini\",\n  \"messages\": {{ JSON.stringify($('Build AI Context').first().json.messages) }}\n}",
    options: {
      timeout: 30000
    }
  },
  id: "11ae993d-553e-4493-b320-a9735be8cdab",
  name: "Call AI (OpenAI)",
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.2,
  position: [10832, 2448],
  retryOnFail: true,
  maxTries: 2,
  waitBetweenTries: 1000,
  onError: "continueErrorOutput"
};

// Rebuild full nodes list
const newNodes = [
  ...workflow.nodes.filter(n => ![
    'Fetch Recent Messages',
    'Has Incoming Image?',
    'Get WhatsApp Media URL',
    'Download WhatsApp Media',
    'Encode Image Base64',
    'Build AI Context',
    'Call AI (OpenAI)'
  ].includes(n.name)),
  fetchRecentMessagesNode,
  hasIncomingImageNode,
  getMediaUrlNode,
  downloadMediaNode,
  encodeImageNode,
  {
    parameters: {
      jsCode: buildAiContextJs
    },
    id: "52ac2847-b821-410e-9838-252e2045436e",
    name: "Build AI Context",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [10608, 2400]
  },
  callAiNode
];

// Rebuild connections
const connections = { ...workflow.connections };

// Fetch Special Programs -> Fetch Recent Messages
connections["Fetch Special Programs"] = {
  main: [
    [
      {
        node: "Fetch Recent Messages",
        type: "main",
        index: 0
      }
    ]
  ]
};

// Fetch Recent Messages -> Has Incoming Image?
connections["Fetch Recent Messages"] = {
  main: [
    [
      {
        node: "Has Incoming Image?",
        type: "main",
        index: 0
      }
    ]
  ]
};

// Has Incoming Image? -> TRUE: Get WhatsApp Media URL, FALSE: Build AI Context
connections["Has Incoming Image?"] = {
  main: [
    [
      {
        node: "Get WhatsApp Media URL",
        type: "main",
        index: 0
      }
    ],
    [
      {
        node: "Build AI Context",
        type: "main",
        index: 0
      }
    ]
  ]
};

// Get WhatsApp Media URL -> Download WhatsApp Media
connections["Get WhatsApp Media URL"] = {
  main: [
    [
      {
        node: "Download WhatsApp Media",
        type: "main",
        index: 0
      }
    ]
  ]
};

// Download WhatsApp Media -> Encode Image Base64
connections["Download WhatsApp Media"] = {
  main: [
    [
      {
        node: "Encode Image Base64",
        type: "main",
        index: 0
      }
    ]
  ]
};

// Encode Image Base64 -> Build AI Context
connections["Encode Image Base64"] = {
  main: [
    [
      {
        node: "Build AI Context",
        type: "main",
        index: 0
      }
    ]
  ]
};

// Build AI Context -> Is Direct Quick Reply?
connections["Build AI Context"] = {
  main: [
    [
      {
        node: "Is Direct Quick Reply?",
        type: "main",
        index: 0
      }
    ]
  ]
};

workflow.nodes = newNodes;
workflow.connections = connections;

fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log('Successfully upgraded workflow with Memory (conversation history) and Vision (image reading)!');
