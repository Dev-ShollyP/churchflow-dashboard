const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '..', 'n8n-workflow-churchflow-fixed.json');
const hymnsPath = path.join(__dirname, '..', 'lib', 'rccg-hymns.json');

const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
const hymnsData = JSON.parse(fs.readFileSync(hymnsPath, 'utf8'));

console.log(`Loaded ${hymnsData.length} hymns from rccg-hymns.json.`);

// Format all hymns into a clean lookup dictionary
const hymnsLookup = {};
hymnsData.forEach(h => {
  let text = `🎵 *RCCG HYMN ${h.number}: ${h.title.toUpperCase()}*\n`;
  if (h.scripture) {
    text += `📖 *Scripture*: ${h.scripture}\n\n`;
  } else {
    text += `\n`;
  }

  h.verses.forEach((v, idx) => {
    text += `*Verse ${idx + 1}*\n${v.trim()}\n\n`;
    if (h.refrain && idx === 0) {
      text += `🔁 *Refrain / Chorus*:\n_${h.refrain.trim()}_\n\n`;
    }
  });

  if (h.refrain && h.verses.length > 1) {
    text += `🔁 *Refrain / Chorus*:\n_${h.refrain.trim()}_\n`;
  }

  const cleanTitleKey = h.title.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  hymnsLookup[cleanTitleKey] = text.trim();
  hymnsLookup[`hymn ${h.number}`] = text.trim();
  hymnsLookup[`hymn${h.number}`] = text.trim();
  hymnsLookup[`rccg hymn ${h.number}`] = text.trim();
});

// Also add special anthems
hymnsLookup['rccg anthem'] = `🎵 *RCCG ANTHEM*

*Verse 1*
We are Redeemites
United in love
Jesus is for us
We shall conquer

*Verse 2*
We are together
United in love
Jesus is for us
We shall conquer

*Verse 3*
We are victorious
United in love
Jesus is for us
We shall conquer

*Verse 4*
Covenant children
United in love
Jesus is for us
We shall conquer

*Verse 5*
Hallelujah,
Hallelujah
Hallelujah Hallelujah`;

hymnsLookup['house fellowship anthem'] = `🎵 *RCCG HOUSE FELLOWSHIP ANTHEM*

*Verse 1*
I love this family of God,
So closely knitted into one,
They have taken me into their arms
And am so glad to be
A part of this great family.

*Verse 2*
I bless this family of God,
So greatly prospered by the Lord,
They have taken me into their arms
And am so glad to be
A part of this great family.

*Verse 3*
I know this family of God,
So deeply rooted in the word,
They have taken me into their arms
And am so glad to be
A part of this great family.

*Verse 4*
I see this family of God,
So highly lifted above all,
They have taken me into their arms
And am so glad to be
A part of this great family.

*Verse 5*
Come, join this family of God,
So highly favoured by the Lord,
They have taken me into their arms
And am so glad to be
A part of this great family.`;

hymnsLookup['sunday school anthem'] = `🎵 *RCCG SUNDAY SCHOOL ANTHEM*
📖 *Scripture*: "Study to shew thyself approved unto God." — 2 Timothy 2:15

*Verse 1*
O Sunday School, on the Lord's day,
O how I love Thee well,
I am happy, it makes me glad
To rejoice at Thy birth.

*Verse 2*
O Sunday School, on the Lord's day,
Thy friendship suits me well,
Both young and old will sing Thy song,
We long for Sunday School.

*Verse 3*
O Sunday School, on the Lord's day,
Christ was Thy first teacher,
The Holy Spirit, great teacher,
Does manifest in thee.

*Verse 4*
O Sunday School, on the Lord's day,
This pledge we give today,
That to God's word we will be true,
Through Sunday School with love.

*Verse 5*
O Sunday School, on the Lord's day,
Thy counsel's so divine,
Lead me to know the holy truth,
Till with my Lord I reign.`;

hymnsLookup['christian home'] = `🎵 *RCCG HYMN 724: GOD GIVE US CHRISTIAN HOMES*
📖 *Scripture*: "Martha welcomed Him into her house... Mary also heard His word." — Luke 10:38

*Verse 1*
God give us Christian homes!
Homes where the Bible is loved and taught,
Homes where the Master’s will is sought,
Homes crowned with beauty Thy love hath wrought;
God give us Christian homes!
God give us Christian homes!

*Verse 2*
God give us Christian homes!
Homes where the father is true and strong,
Homes that are free from the blight of wrong,
Homes that are joyous with love and song;
God give us Christian homes!
God give us Christian homes!

*Verse 3*
God give us Christian homes!
Homes where the mother, in caring quest,
Strives to show others Thy love is best,
Homes where the Lord is an honored guest;
God give us Christian homes!
God give us Christian homes!

*Verse 4*
God give us Christian homes!
Homes where the children are led to know
Christ in His beauty who loves them so,
Homes where the altar fires ever glow;
God give us Christian homes!
God give us Christian homes!`;

// Find Build AI Context node
const buildContextNode = workflow.nodes.find(n => n.name === 'Build AI Context');
if (!buildContextNode) {
  console.error('Could not find Build AI Context node');
  process.exit(1);
}

const hymnsLookupString = JSON.stringify(hymnsLookup);

buildContextNode.parameters.jsCode = `const settingsItems = $("Get Branch Settings").all();
const settings = settingsItems.length ? settingsItems[0].json : {};
const promptItems = $("Get Active AI Prompt").all();
const prompt = promptItems.length ? promptItems[0].json : {};
const articleItems = $("Get Knowledge Articles").all();
const articles = articleItems.map(function(i) { return i.json; });

const parsed = $("Parse Incoming Message").first().json;
const userText = (parsed.text || '').trim();
const lowerText = userText.toLowerCase();
const buttonId = (parsed.button_id || '').trim();

const storageBase = 'https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers';
const CHURCH_ADDRESS = '7, Powerline Street, Moshalashi B/Stop, Iyana Iyesi, Ota, Ogun State';
const GOOGLE_MAPS_LINK = 'https://www.google.com/maps/search/?api=1&query=RCCG+Everflourishing+Mega+Sanctuary,+7+Powerline+Street+Moshalashi+B/Stop+Iyana+Iyesi+Ota+Ogun+State';

// ── 1. HYMNS & ANTHEMS DATABASE (Direct Full Lyrics) ──
const HYMNS_DICT = ${hymnsLookupString};

// Check for anthem keywords
if (lowerText.includes('sunday school') && (lowerText.includes('anthem') || lowerText.includes('lyrics') || lowerText.includes('song') || lowerText.includes('hymn'))) {
  return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: HYMNS_DICT['sunday school anthem'] } }];
}
if (lowerText.includes('house fellowship') && (lowerText.includes('anthem') || lowerText.includes('song') || lowerText.includes('lyrics') || lowerText.includes('hymn') || lowerText.includes('family of god'))) {
  return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: HYMNS_DICT['house fellowship anthem'] } }];
}
if ((lowerText.includes('redeem') || lowerText.includes('rccg')) && (lowerText.includes('anthem') || lowerText.includes('song') || lowerText.includes('lyrics') || lowerText.includes('hymn') || lowerText.includes('we are redeemites'))) {
  return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: HYMNS_DICT['rccg anthem'] } }];
}
if (lowerText === 'rccg anthem' || lowerText === 'anthem' || lowerText === 'the rccg anthem' || lowerText === 'the anthem' || lowerText === 'redeem anthem') {
  return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: HYMNS_DICT['rccg anthem'] } }];
}

// Clean user text for hymn searching
const cleanText = lowerText.replace(/[^a-z0-9]/g, ' ').replace(/\\s+/g, ' ').trim();

// Check if user is asking for a hymn by title or number
for (const key in HYMNS_DICT) {
  if (key.length > 3) {
    if (cleanText.includes(key) || lowerText.includes(key)) {
      return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: HYMNS_DICT[key] } }];
    }
  }
}

// ── 2. CHURCH LOCATION & DIRECTIONS (Always prompt with address + Google Maps) ──
const isDirectionQuery = lowerText.includes('direction') || 
  lowerText.includes('location') || 
  lowerText.includes('address') || 
  lowerText.includes('map') || 
  lowerText.includes('where is the church') || 
  lowerText.includes('how to get to church') || 
  lowerText.includes('locate') || 
  lowerText.includes('church premises');

if (isDirectionQuery) {
  const directionText = \`📍 *RCCG EVERFLOURISHING MEGA SANCTUARY LOCATION*\\n\\n\` +
    \`🏢 *Address*:\\n7, Powerline Street, Moshalashi B/Stop, Iyana Iyesi, Ota, Ogun State.\\n\\n\` +
    \`🗺️ *Google Maps Navigation Link*:\\n\${GOOGLE_MAPS_LINK}\\n\\n\` +
    \`🚗 *Directions*:\\nIf you are coming from the main road, follow the route toward *Iyana Iyesi* and turn into *Powerline Street* at *Moshalashi Bus Stop*. The church is easily accessible.\\n\\n\` +
    \`_We look forward to welcoming you to worship with us!_\`;
  return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: directionText } }];
}

// ── 3. DYNAMIC EVENTS FROM DATABASE ──
const dbEventsItems = $("Fetch Events").all();
const dbEvents = dbEventsItems.map(function(i) { return i.json; }).filter(Boolean);

const specialProgramItems = $("Fetch Special Programs").all();
const specialPrograms = specialProgramItems.map(function(i) { return i.json; }).filter(Boolean);

// Filter upcoming top 3 events to save tokens
const todayStr = new Date().toISOString().split('T')[0];
const upcomingDbEvents = dbEvents
  .filter(function(e) { return (e.event_date || '') >= todayStr; })
  .slice(0, 4);

const upcomingSpecial = specialPrograms
  .filter(function(p) { return (p.program_date || p.end_date || '') >= todayStr; })
  .slice(0, 3);

// ── 4. SPECIFIC SERVICE SCHEDULE BUTTON OR STRICT QUERY ──
const isStrictServiceQuery = buttonId === 'btn_services' || 
  lowerText === 'service times' || 
  lowerText === 'service schedule' || 
  lowerText === 'when is service' || 
  lowerText === 'church services';

if (isStrictServiceQuery) {
  let scheduleText = \`🎉 *RCCG EVERFLOURISHING MEGA SANCTUARY SERVICES*\\n\\n• *Sundays*: 1st Service @ 8:00 AM | Sunday School @ 9:45 AM | 2nd Service @ 10:15 AM\\n• *Tuesdays (Digging Deep)*: 6:00 PM – 7:30 PM\\n• *Thursdays (Faith Clinic)*: 6:00 PM – 7:00 PM\\n• *Monthly Youth Vigil (YAYA)*: Last Wednesday of the month @ 11:00 PM\\n\\n📍 *Location*: Main Sanctuary\\n\${CHURCH_ADDRESS}\\n🗺️ *Google Maps*: \${GOOGLE_MAPS_LINK}\`;
  let sundayFlyer = storageBase + '/Service/First%20Service.jpg';
  return [{ json: { is_direct: true, is_interactive: false, image_url: sundayFlyer, direct_reply: scheduleText } }];
}

// ── 5. GIVING & TITHES INTENT ──
if (buttonId === 'btn_giving' || lowerText === 'tithe' || lowerText === 'offering' || lowerText === 'account number' || lowerText === 'how to give') {
  const replyText = \`💳 *CHURCH GIVING & TITHES*\\n\\n🏛️ *Tithe & Offering Account*\\n• *Bank*: Access Bank\\n• *Account Number*: \\\`0695126926\\\`\\n• *Account Name*: RCCG Everflourishing Parish\\n\\n🏗️ *Building Project Account*\\n• *Bank*: United Bank for Africa (UBA)\\n• *Account Number*: \\\`1028494770\\\`\\n• *Account Name*: RCCG EVERFLOURISHING PROJECT\\n\\n_God bless you richly as you give into His sanctuary!_\`;
  return [{ json: { is_direct: true, is_interactive: false, image_url: storageBase + '/Giving/Offering.png', direct_reply: replyText } }];
}

// ── 6. GREETINGS & MENU ──
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
              { type: 'reply', reply: { id: 'btn_first_timer', title: 'I am New Here' } }
            ]
          }
        }
      }
    }
  }];
}

// ── 7. PASS TO OPENAI WITH ENRICHED KNOWLEDGE & RULES ──
const now = new Date();
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

const specialProgramsBlock = upcomingSpecial
  .map(function(p) { return '- Program: ' + (p.title || '') + ' | Date: ' + (p.program_date || '') + ' | Time: ' + (p.start_time || '') + ' | Theme: ' + (p.description || ''); })
  .join('\\n');

const eventsBlock = upcomingDbEvents
  .map(function(e) { return '- Event: ' + (e.title || '') + ' | Date: ' + (e.event_date || '') + ' | Time: ' + (e.start_time || '') + ' | Theme: ' + (e.description || ''); })
  .join('\\n');

const knowledgeBlock = articles.slice(0, 5)
  .map(function(a) { return '### ' + a.title + '\\n' + (a.markdown || '').slice(0, 400); })
  .join('\\n\\n');

const systemPrompt = \`You are EVF Bot, the official automated WhatsApp AI assistant for RCCG Everflourishing Mega Sanctuary (Ogun 27 Ota).

CURRENT DATE & TIME (WAT): \${watTime}

CHURCH ADDRESS & NAVIGATION:
Address: 7, Powerline Street, Moshalashi B/Stop, Iyana Iyesi, Ota, Ogun State.
Google Maps: \${GOOGLE_MAPS_LINK}

UPCOMING SPECIAL PROGRAMS:
\${specialProgramsBlock || 'None currently listed'}

UPCOMING REGULAR SERVICES:
\${eventsBlock || 'Sunday 8:00 AM, Tuesday 6:00 PM, Thursday 6:00 PM, Monthly Youth Vigil on Last Wednesday 11:00 PM'}

KNOWLEDGE BASE:
\${knowledgeBlock}

CRITICAL RULES:
1. HYMN REQUESTS (STRICT):
   - When a user asks for ANY hymn by title or number (e.g. Blessed Assurance, Take My Life, Great is Thy Faithfulness), ALWAYS PROVIDE THE FULL, COMPLETE HYMN LYRICS (with all verses and chorus/refrain).
   - NEVER provide a summary, essay, or overview instead of giving the lyrics. Always format with *Verse 1*, *Refrain / Chorus*, *Verse 2*, etc.

2. DIRECTIONS & LOCATION (STRICT):
   - Whenever a user asks for directions, location, map, address, or how to get to church, ALWAYS include the full address AND the Google Maps link:
     \${GOOGLE_MAPS_LINK}

3. WHATSAPP FORMATTING:
   - Always use single asterisks (*bold*) for bold text, NEVER double asterisks (**bold**).
   - Keep replies spiritual, warm, concise, and structured.\`;

return [{
  json: {
    is_direct: false,
    is_interactive: false,
    system_prompt: systemPrompt,
    user_message: userText
  }
}];`;

fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log('Successfully updated n8n-workflow-churchflow-fixed.json with hymns & Google Maps directions!');
