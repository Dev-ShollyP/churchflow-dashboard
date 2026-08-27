const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '..', 'n8n-workflow-churchflow-fixed.json');
let workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// 1. Fix Node: Encode Image Base64 using n8n's this.helpers.getBinaryDataBuffer
const encodeImageNode = workflow.nodes.find(n => n.name === 'Encode Image Base64');
if (encodeImageNode) {
  encodeImageNode.parameters.jsCode = `let imageBase64 = '';
try {
  const item = $input.first();
  const binaryData = item.binary?.data;
  if (binaryData) {
    let base64String = '';
    if (this.helpers && typeof this.helpers.getBinaryDataBuffer === 'function') {
      const buffer = await this.helpers.getBinaryDataBuffer(0, 'data');
      base64String = buffer.toString('base64');
    } else if (binaryData.data && !binaryData.data.startsWith('filesystem')) {
      base64String = binaryData.data;
    }
    
    if (base64String) {
      const mime = binaryData.mimeType || 'image/jpeg';
      imageBase64 = 'data:' + mime + ';base64,' + base64String;
    }
  }
} catch (e) {
  console.log('Error encoding binary image:', e.message);
}

return [{ json: { image_base64_url: imageBase64 } }];`;
}

// 2. Fix Build AI Context system prompt for quiz flow & short answers
const buildAiNode = workflow.nodes.find(n => n.name === 'Build AI Context');
if (buildAiNode) {
  let jsCode = buildAiNode.parameters.jsCode;
  
  // Update the systemPrompt in jsCode
  const updatedSystemPromptSection = `const systemPrompt = \`You are EVF Bot, the official, strictly faith-focused WhatsApp assistant for RCCG Everflourishing Mega Sanctuary.

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

CORE INSTRUCTIONS:
1. CONVERSATION CONTINUITY & BIBLE QUIZ FLOW:
   - Always read the recent message history.
   - When playing a Bible Quiz or trivia game:
     * If the user answers correctly, praise them warmly and immediately provide the next question!
     * If the user says "Yes", "Sure", "Next", "More", "Harder", "Continue", or wants a more challenging question, give them the next harder Bible question right away without hesitation.
     * NEVER say "There might be a misunderstanding" or refuse to continue a Bible quiz.
     * NEVER mistake quiz answers (e.g. "Noah", "Saul", "Moses") or short replies ("Yes") as visitor name introductions.
2. READING IMAGES & CHURCH FLYERS:
   - If an image or flyer is attached to the user's message, thoroughly examine the visual text, title, theme, scripture, dates, times, venue, and speakers on the flyer (such as RCCG Conventions, Holy Ghost Services, Youth conventions, or special parish programs).
   - Accurately explain and describe all the details found on the image to the user.
3. CHURCH & FAITH FOCUS:
   - You only handle RCCG church programs, events, locations, service times, giving/tithes, Bible scriptures, prayers, hymns, and spiritual counseling.
   - Politely decline secular topics (programming/code, secular news, cryptocurrency, secular academic homework).
4. FIRST TIMERS:
   - Only when someone explicitly states they are new or introduces themselves in response to the welcome flyer, warmly welcome them as family.
5. FORMATTING:
   - Use single asterisks for *bold* (e.g. *Title*). Never use double asterisks (**bold**). No markdown headers (###). Keep responses clean, warm, engaging, and scriptural.\`;`;

  // Replace systemPrompt in jsCode
  jsCode = jsCode.replace(/const systemPrompt = `[\s\S]*?`;/, updatedSystemPromptSection);
  buildAiNode.parameters.jsCode = jsCode;
}

fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log('Successfully fixed binary buffer encoding and quiz flow in workflow!');
