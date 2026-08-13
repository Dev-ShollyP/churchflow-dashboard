const fs = require('fs');

const workflow = {
  "name": "ChurchFlow",
  "nodes": [
    {
      "parameters": {
        "path": "whatsapp-webhook",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "97e7d58e-929f-40f9-9782-13ad30e2e848",
      "name": "WhatsApp Webhook GET",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [ 6016, 2848 ],
      "webhookId": "6e485f4a-8c27-4742-a387-441dc5a7a5af"
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-webhook",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "34d249ef-b330-4b8c-bd31-dff567c941aa",
      "name": "WhatsApp Webhook POST",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [ 6016, 3312 ],
      "webhookId": "64702688-9c05-4d9f-ab7a-d8964596d2db"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 1
          },
          "conditions": [
            {
              "leftValue": "={{$json.query[\"hub.verify_token\"]}}",
              "rightValue": "={{$vars.WHATSAPP_VERIFY_TOKEN}}",
              "operator": {
                "type": "string",
                "operation": "equals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "c77f5789-dcc3-4139-a76f-8fa314a58359",
      "name": "Verify Token Matches",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [ 6240, 2848 ]
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "={{$json.query[\"hub.challenge\"]}}",
        "options": {
          "responseCode": 200
        }
      },
      "id": "d0ddadd7-e909-4166-b00a-eb686f44bd19",
      "name": "Respond With Challenge",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [ 6464, 2752 ]
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "Forbidden",
        "options": {
          "responseCode": 403
        }
      },
      "id": "178c3664-4a6f-4623-8e06-5dada66ef54b",
      "name": "Respond Forbidden",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [ 6464, 2944 ]
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "EVENT_RECEIVED",
        "options": {
          "responseCode": 200
        }
      },
      "id": "9fdd7c51-a525-4166-870a-1d2ed709cba1",
      "name": "Respond OK (POST)",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [ 6240, 3216 ]
    },
    {
      "parameters": {
        "jsCode": "const entry = $input.first().json.body.entry?.[0];\nconst change = entry?.changes?.[0]?.value;\nconst message = change?.messages?.[0];\n\nif (!message) {\n  return [{ json: { skip: true } }];\n}\n\nlet text = '';\nlet buttonId = '';\n\nif (message.type === 'text') {\n  text = message.text?.body || '';\n} else if (message.type === 'interactive') {\n  if (message.interactive.type === 'button_reply') {\n    buttonId = message.interactive.button_reply.id;\n    text = message.interactive.button_reply.title;\n  } else if (message.interactive.type === 'list_reply') {\n    buttonId = message.interactive.list_reply.id;\n    text = message.interactive.list_reply.title;\n  }\n}\n\nreturn [{\n  json: {\n    skip: false,\n    phone_number_id: change.metadata.phone_number_id,\n    from_phone: message.from,\n    wa_message_id: message.id,\n    text: text,\n    button_id: buttonId,\n    message_type: message.type,\n    profile_name: change.contacts?.[0]?.profile?.name || 'WhatsApp User'\n  }\n}];"
      },
      "id": "4286bc83-8d3f-4eed-9d7d-61446d070c92",
      "name": "Parse Incoming Message",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [ 6240, 3408 ]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 1
          },
          "conditions": [
            {
              "leftValue": "={{$json.skip}}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "true"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "defb5d92-be46-4425-acc8-1cdc28869402",
      "name": "Is Status Update? (skip)",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [ 6464, 3408 ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/processed_messages?on_conflict=wa_message_id",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Prefer",
              "value": "resolution=ignore-duplicates,return=representation"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { wa_message_id: $json.wa_message_id } }}",
        "options": {}
      },
      "id": "2f4c91dc-764e-443b-9c7f-664143d96776",
      "name": "Claim Message ID (Dedup)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 6688, 3408 ],
      "onError": "continueRegularOutput",
      "alwaysOutputData": true
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 1
          },
          "conditions": [
            {
              "leftValue": "={{$(\"Parse Incoming Message\").first().json.wa_message_id}}",
              "rightValue": "",
              "operator": {
                "type": "string",
                "operation": "notEmpty"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "13d3c3cf-95cf-41f7-bb48-b0b3a57a23d9",
      "name": "New Message? (not duplicate)",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [ 6912, 3408 ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://graph.facebook.com/v20.0/{{ $('Parse Incoming Message').first().json.phone_number_id }}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.WHATSAPP_ACCESS_TOKEN}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { messaging_product: 'whatsapp', status: 'read', message_id: $json.wa_message_id, typing_indicator: { type: 'text' } } }}",
        "options": {}
      },
      "id": "9d091e36-f2f1-4c2d-99b6-3eccfb64cee6",
      "name": "Send Typing Indicator",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 7136, 3408 ],
      "retryOnFail": false,
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "jsCode": "return [{ json: $('Parse Incoming Message').first().json }];"
      },
      "id": "c1bbd58d-81f8-4484-8e8a-cb353ed050a5",
      "name": "Restore Parsed Message Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [ 7360, 3408 ]
    },
    {
      "parameters": {
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/whatsapp_sessions",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "phone_number_id",
              "value": "=eq.{{$json.phone_number_id}}"
            },
            {
              "name": "select",
              "value": "branch_id"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            }
          ]
        },
        "options": {}
      },
      "id": "662f2fb7-8953-4a06-ae51-94c851d6ca40",
      "name": "Lookup Branch by Phone Number ID",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 7584, 3408 ]
    },
    {
      "parameters": {
        "jsCode": "const raw = $input.first().json;\nconst branch = Array.isArray(raw) ? raw[0] : raw;\nif (!branch || !branch.branch_id) {\n  throw new Error('No branch found for this WhatsApp phone_number_id. Add a row to whatsapp_sessions first.');\n}\nreturn [{ json: { branch_id: branch.branch_id } }];"
      },
      "id": "2ccebac3-2275-4cd2-8c60-52509ef5143e",
      "name": "Extract branch_id",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [ 7808, 3408 ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/members?on_conflict=branch_id,phone",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "Prefer",
              "value": "resolution=merge-duplicates,return=representation"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { branch_id: $(\"Extract branch_id\").first().json.branch_id, full_name: $(\"Parse Incoming Message\").first().json.profile_name, phone: $(\"Parse Incoming Message\").first().json.from_phone } }}",
        "options": {}
      },
      "id": "1c234015-4fea-4613-a450-95c41ae61fe4",
      "name": "Upsert Member",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 8032, 3408 ]
    },
    {
      "parameters": {
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/conversations",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "member_id",
              "value": "=eq.{{$json[0]?.id || $json.id}}"
            },
            {
              "name": "status",
              "value": "eq.open"
            },
            {
              "name": "select",
              "value": "id"
            },
            {
              "name": "order",
              "value": "started_at.desc"
            },
            {
              "name": "limit",
              "value": "1"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            }
          ]
        },
        "options": {}
      },
      "id": "dc6acbea-ebf1-43ee-9067-0eed0db69bc5",
      "name": "Find Open Conversation",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "alwaysOutputData": true,
      "position": [ 8256, 3408 ]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 1
          },
          "conditions": [
            {
              "leftValue": "={{$json[0]?.id || $json.id}}",
              "rightValue": "",
              "operator": {
                "type": "string",
                "operation": "empty"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "8271717a-135a-463f-bd47-28617d7ebd9b",
      "name": "No Open Conversation?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [ 8480, 3408 ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/conversations",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "Prefer",
              "value": "return=representation"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { branch_id: $(\"Extract branch_id\").first().json.branch_id, member_id: ($(\"Upsert Member\").first().json[0]?.id || $(\"Upsert Member\").first().json.id), channel: \"whatsapp\" } }}",
        "options": {}
      },
      "id": "73f8629f-0e1a-4342-92dc-aac88ceeb0c9",
      "name": "Create Conversation",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 8704, 3328 ]
    },
    {
      "parameters": {
        "jsCode": "const raw = $input.first().json;\nconst conv = Array.isArray(raw) ? raw[0] : raw;\nreturn [{ json: { conversation_id: conv.id } }];"
      },
      "id": "e59621a2-e327-4bae-9ffb-3f2f22b89746",
      "name": "Resolve conversation_id",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [ 8928, 3408 ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { conversation_id: $(\"Resolve conversation_id\").first().json.conversation_id, sender: \"member\", message: $(\"Parse Incoming Message\").first().json.text } }}",
        "options": {}
      },
      "id": "d3f88839-911b-4024-b09a-675fb14d17f8",
      "name": "Save Inbound Message",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 9152, 3408 ]
    },
    {
      "parameters": {
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/branch_settings",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "branch_id",
              "value": "=eq.{{$(\"Extract branch_id\").first().json.branch_id}}"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            }
          ]
        },
        "options": {}
      },
      "id": "e5035d53-0fd7-4de4-aa8e-2c4d93b36c6e",
      "name": "Get Branch Settings",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 9376, 3408 ]
    },
    {
      "parameters": {
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/ai_prompt_templates",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "branch_id",
              "value": "=eq.{{$(\"Extract branch_id\").first().json.branch_id}}"
            },
            {
              "name": "is_active",
              "value": "eq.true"
            },
            {
              "name": "limit",
              "value": "1"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            }
          ]
        },
        "options": {}
      },
      "id": "7776ee7d-5212-48df-a201-bd342df68912",
      "name": "Get Active AI Prompt",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 9600, 3408 ]
    },
    {
      "parameters": {
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/knowledge_articles",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "branch_id",
              "value": "=eq.{{$(\"Extract branch_id\").first().json.branch_id}}"
            },
            {
              "name": "visibility",
              "value": "eq.public"
            },
            {
              "name": "order",
              "value": "priority.desc"
            },
            {
              "name": "limit",
              "value": "20"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            }
          ]
        },
        "options": {}
      },
      "id": "f1bb3445-4ba1-4ddb-9929-e124b0241017",
      "name": "Get Knowledge Articles",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 9824, 3408 ]
    },
    {
      "parameters": {
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/events",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "branch_id",
              "value": "=eq.{{$(\"Extract branch_id\").first().json.branch_id}}"
            },
            {
              "name": "order",
              "value": "event_date.asc"
            },
            {
              "name": "limit",
              "value": "50"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            }
          ]
        },
        "options": {}
      },
      "id": "e8293f77-5264-44b2-b131-01772bf2891d",
      "name": "Fetch Events",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 9936, 3408 ],
      "alwaysOutputData": true
    },
    {
      "parameters": {
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/special_programs",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "branch_id",
              "value": "=eq.{{$(\"Extract branch_id\").first().json.branch_id}}"
            },
            {
              "name": "is_active",
              "value": "eq.true"
            },
            {
              "name": "order",
              "value": "program_date.asc"
            },
            {
              "name": "limit",
              "value": "20"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            }
          ]
        },
        "options": {}
      },
      "id": "d378aa6d-9d65-45e0-8dc9-6a24771ec1ac",
      "name": "Fetch Special Programs",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 10048, 3408 ],
      "alwaysOutputData": true
    },
    {
      "parameters": {
        "jsCode": `const settingsItems = $("Get Branch Settings").all();
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

// Complete Bible verse lookup dictionary
const BIBLE_VERSES = {
  'mark 11:23': '"For verily I say unto you, That whosoever shall say unto this mountain, Be thou removed, and be thou cast into the sea; and shall not doubt in his heart, but shall believe that those things which he saith shall come to pass; he shall have whatsoever he saith." — Mark 11:23',
  '1 timothy 4:12': '"Let no man despise thy youth; but be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity." — 1 Timothy 4:12',
  'psalm 100:4': '"Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name." — Psalm 100:4',
  'jeremiah 33:3': '"Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not." — Jeremiah 33:3',
  '2 timothy 2:15': '"Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth." — 2 Timothy 2:15',
  'james 5:14-15': '"Is any sick among you? let him call for the elders of the church; and let them pray over him... And the prayer of faith shall save the sick." — James 5:14-15',
  'colossians 3:14': '"And above all these things put on charity, which is the bond of perfectness." — Colossians 3:14',
  '1 corinthians 10:16': '"The cup of blessing which we bless, is it not the communion of the blood of Christ? The bread which we break, is it not the communion of the body of Christ?" — 1 Corinthians 10:16'
};

function quoteScripture(ref) {
  if (!ref) return '';
  const key = ref.toLowerCase().trim();
  if (BIBLE_VERSES[key]) return BIBLE_VERSES[key];
  for (var k in BIBLE_VERSES) {
    if (key.indexOf(k) !== -1 || k.indexOf(key) !== -1) return BIBLE_VERSES[k];
  }
  return '"' + ref + '"';
}

function fmtDateHuman(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00+01:00');
    return d.toLocaleDateString('en-US', { timeZone: 'Africa/Lagos', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

function fmtTimeHuman(t) {
  if (!t) return '';
  if (t.indexOf(':') !== -1) {
    const parts = t.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + m + ' ' + ampm;
  }
  return t;
}

// Dynamic Events fetched from Supabase Database (Dashboard Managed)
const dbEventsItems = $("Fetch Events").all();
const dbEvents = dbEventsItems.map(function(i) { return i.json; }).filter(function(e) { return e && e.title; });

function parseMeta(desc) {
  if (!desc) return { cleanDesc: '', embeddedFlyer: '', embeddedScripture: '' };
  let cleanDesc = desc;
  let embeddedFlyer = '';
  let embeddedScripture = '';
  const fMatch = desc.match(/\\[FLYER:\\s*([^\\]]+)\\]/);
  if (fMatch) { embeddedFlyer = fMatch[1].trim(); cleanDesc = cleanDesc.replace(/\\[FLYER:\\s*[^\\]]+\\]/g, '').trim(); }
  const sMatch = desc.match(/\\[SCRIPTURE:\\s*([^\\]]+)\\]/);
  if (sMatch) { embeddedScripture = sMatch[1].trim(); cleanDesc = cleanDesc.replace(/\\[SCRIPTURE:\\s*[^\\]]+\\]/g, '').trim(); }
  return { cleanDesc, embeddedFlyer, embeddedScripture };
}

function findMatchingDbEvent(queryLower) {
  for (var i = 0; i < dbEvents.length; i++) {
    const ev = dbEvents[i];
    const t = (ev.title || '').toLowerCase();
    if (!t) continue;
    if (queryLower.indexOf(t) !== -1 || t.indexOf(queryLower) !== -1) return ev;
    if (queryLower.indexOf('youth') !== -1 && t.indexOf('youth') !== -1) return ev;
    if (queryLower.indexOf('digging') !== -1 && (t.indexOf('digging') !== -1 || t.indexOf('bible study') !== -1)) return ev;
    if (queryLower.indexOf('faith clinic') !== -1 && (t.indexOf('faith clinic') !== -1 || t.indexOf('miracle hour') !== -1)) return ev;
    if (queryLower.indexOf('thanks') !== -1 && t.indexOf('thanksgiving') !== -1) return ev;
    if (queryLower.indexOf('prayer sunday') !== -1 && t.indexOf('prayer sunday') !== -1) return ev;
    if (queryLower.indexOf('super sunday') !== -1 && t.indexOf('super sunday') !== -1) return ev;
  }
  return null;
}

const specialProgramItems = $("Fetch Special Programs").all();
const specialPrograms = specialProgramItems
  .map(function(i) { return i.json; })
  .filter(function(p) { return p && p.id && p.title; })
  .sort(function(a, b) { return new Date(a.program_date || 0) - new Date(b.program_date || 0); });

// 0. HYMN REQUEST MATCH
if (lowerText.indexOf('hymn') !== -1 || lowerText.indexOf('showers of blessing') !== -1 || lowerText.indexOf('blessed assurance') !== -1 || lowerText.indexOf('all hail') !== -1) {
  let replyText = '';
  if (lowerText.indexOf('showers of blessing') !== -1 || lowerText.indexOf('235') !== -1) {
    replyText = \`🎵 *RCCG HYMN 235: THERE SHALL BE SHOWERS OF BLESSING*\\n📖 *Scripture*: "There shall be showers of blessing." — Ezek 34:26\\n\\n*Verse 1*\\nThere shall be showers of blessing:\\nThis is the promise of love;\\nThere shall be seasons refreshing,\\nSent from the Savior above.\\n\\n*Verse 2*\\nThere shall be showers of blessing,\\nPrecious reviving again;\\nOver the hills and the valleys,\\nSound of abundance of rain.\\n\\n*Verse 3*\\nThere shall be showers of blessing;\\nSend them upon us, O Lord;\\nGrant to us now a refreshing,\\nCome, and now honor Thy Word.\\n\\n*Verse 4*\\nThere shall be showers of blessing:\\nOh, that today they might fall,\\nNow as to God we're confessing,\\nNow as on Jesus we call!\\n\\n🔁 *Refrain / Chorus*:\\nShowers of blessing,\\nShowers of blessing we need;\\nMercy drops round us are falling,\\nBut for the showers we plead.\`;
  } else {
    replyText = \`🎵 *RCCG HYMNAL*\\n\\nYou can access our complete hymnal collection directly on our church web dashboard:\\n👉 https://churchflow-dashboard.vercel.app/hymns\\n\\nOr reply with the Hymn Number (e.g. "Hymn 20" or "Hymn 235") to view the full lyrics! 🙏\`;
  }
  return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: replyText } }];
}

// 1. DYNAMIC MATCH FOR ANY EDITED OR NEW CUSTOM EVENT IN SUPABASE DB (Dashboard Managed)
const matchedDbEvent = findMatchingDbEvent(lowerText);
if (matchedDbEvent) {
  const meta = parseMeta(matchedDbEvent.description);

  // Dynamic image serving URL from Next.js server route /api/flyers?id=
  let flyer = '';
  if (matchedDbEvent.id && String(matchedDbEvent.id).indexOf('recurring-') !== 0) {
    flyer = 'https://churchflow-dashboard.vercel.app/api/events/flyer?id=' + matchedDbEvent.id;
  } else {
    flyer = matchedDbEvent.banner_url || meta.embeddedFlyer || storageBase + '/Service/First%20Service.jpg';
  }

  const rawScripture = meta.embeddedScripture || matchedDbEvent.scripture || '';
  const fullVerseQuote = rawScripture ? quoteScripture(rawScripture) : '';
  const dateFormatted = fmtDateHuman(matchedDbEvent.event_date);
  const startTimeFmt = fmtTimeHuman(matchedDbEvent.start_time || '08:00');
  const endTimeFmt = fmtTimeHuman(matchedDbEvent.end_time || '12:00');
  const locName = matchedDbEvent.location || 'Main Sanctuary';

  let replyText = \`🔥 *\${(matchedDbEvent.title || '').toUpperCase()}*\\n\\n• *Date*: *\${dateFormatted}*\\n• *Time*: *\${startTimeFmt} – \${endTimeFmt}*\\n📍 *Location*: *\${locName}*\\n\${CHURCH_ADDRESS}\`;
  if (meta.cleanDesc) replyText += \`\\n\\n\${meta.cleanDesc}\`;
  if (fullVerseQuote) replyText += \`\\n\\n📖 *Verse*: \${fullVerseQuote}\`;

  return [{ json: { is_direct: true, is_interactive: false, image_url: flyer, direct_reply: replyText } }];
}

// 2. INDIVIDUAL SPECIAL PROGRAM MATCH
function matchesSpecialProgram(program) {
  if (buttonId === 'btn_program_' + program.id) return true;
  const t = (program.title || '').toLowerCase();
  if (t && lowerText.indexOf(t) !== -1) return true;
  if (t && lowerText.length >= 4 && t.indexOf(lowerText) !== -1) return true;
  const kw = (program.keywords || '').toLowerCase().split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  for (var k = 0; k < kw.length; k++) {
    if (kw[k] && lowerText.indexOf(kw[k]) !== -1) return true;
  }
  return false;
}

for (var p = 0; p < specialPrograms.length; p++) {
  const program = specialPrograms[p];
  if (matchesSpecialProgram(program)) {
    let dateRange = '';
    if (program.program_date) {
      dateRange = fmtDateHuman(program.program_date);
      if (program.end_date && program.end_date !== program.program_date) {
        dateRange += ' – ' + fmtDateHuman(program.end_date);
      }
    }
    const lines = [\`🌟 *\${(program.title || '').toUpperCase()}* 🌟\`];
    if (dateRange) lines.push(\`• 🗓️ *Date*: *\${dateRange}*\`);
    lines.push(\`• 📍 *Location*: *\${program.venue || 'Main Sanctuary'}*\\n\${CHURCH_ADDRESS}\`);
    let replyText = lines.join('\\n');
    if (program.description) replyText += \`\\n\\n\${program.description}\`;
    const flyer = program.flyer_url || program.image_url || storageBase + '/Service/First%20Service.jpg';
    return [{ json: { is_direct: true, is_interactive: false, image_url: flyer, direct_reply: replyText } }];
  }
}

// 3. GENERAL UPCOMING SPECIAL EVENTS / PROGRAMS QUERY
if (buttonId === 'btn_events' || lowerText.indexOf('special program') !== -1 || lowerText.indexOf('upcoming event') !== -1 || lowerText.indexOf('special event') !== -1 || lowerText.indexOf('upcoming program') !== -1 || lowerText.indexOf('events') !== -1 || lowerText.indexOf('programs') !== -1) {
  if (!specialPrograms.length) {
    const replyText = \`🌟 *SPECIAL PROGRAMS & EVENTS* 🌟\\n\\nThere are no special programs scheduled at the moment. Check back soon — we'll let you know as soon as something is added! 🙏\`;
    return [{ json: { is_direct: true, is_interactive: false, image_url: '', direct_reply: replyText } }];
  }
  const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
  const listLines = specialPrograms.map(function(program, idx) {
    const num = numberEmojis[idx] || (idx + 1) + '.';
    let line = \`\${num} 🌟 *\${program.title}*\`;
    if (program.program_date) line += \`\\n• *Date*: \${fmtDateHuman(program.program_date)}\`;
    line += \`\\n• *Location*: \${program.venue || 'Main Sanctuary'}\\n\${CHURCH_ADDRESS}\`;
    return line;
  }).join('\\n\\n');
  const replyText = \`🌟 *UPCOMING SPECIAL PROGRAMS & EVENTS* 🌟\\n\\n\${listLines}\\n\\nReply with the program name to get full details and flyer for each event!\`;
  const firstFlyer = specialPrograms[0].flyer_url || specialPrograms[0].image_url || storageBase + '/Service/First%20Service.jpg';
  return [{ json: { is_direct: true, is_interactive: false, image_url: firstFlyer, direct_reply: replyText } }];
}

// 4. FIRST TIMER FLOW
if (buttonId === 'btn_first_timer' || lowerText.indexOf('first time') !== -1 || lowerText.indexOf('first timer') !== -1 || lowerText.indexOf('new member') !== -1 || lowerText.indexOf('visitor') !== -1 || lowerText.indexOf('im new') !== -1 || lowerText.indexOf('i am new') !== -1 || lowerText.indexOf('visiting') !== -1) {
  const replyText = \`🎉 *WELCOME TO RCCG EVERFLOURISHING MEGA SANCTUARY!* 🎉\\n\\nWe are overjoyed to have you join us! At EVF Sanctuary, you are family, and we believe God brought you here for a glorious purpose.\\n\\n✨ *Our Weekly Services*:\\n• *Sundays*: 1st Service @ 8:00 AM | Sunday School @ 9:45 AM | 2nd Service @ 10:15 AM\\n• *Tuesdays (Digging Deep)*: 6:00 PM – 7:00 PM\\n• *Thursdays (Faith Clinic)*: 6:00 PM – 7:00 PM\\n\\n📍 *Location*: Main Sanctuary\\n\${CHURCH_ADDRESS}\\n\\nWe would love to get to know you better! Please reply to us with:\\n1️⃣ *Your Full Name*\\n2️⃣ *Your Residential Location/Area*\\n3️⃣ *Any Prayer Request you would like us to pray for*\\n\\nGod bless you richly! 🙏\`;
  return [{ json: { is_direct: true, is_interactive: false, image_url: storageBase + '/Service/First%20Service.jpg', direct_reply: replyText } }];
}

// 4a. DIRECTIONS / LOCATION REQUEST
if (
  lowerText.indexOf('direction') !== -1 ||
  lowerText.indexOf('how do i get') !== -1 ||
  lowerText.indexOf('how to get') !== -1 ||
  lowerText.indexOf('where is the church') !== -1 ||
  lowerText.indexOf('where is your church') !== -1 ||
  lowerText.indexOf('church location') !== -1 ||
  lowerText.indexOf('church address') !== -1 ||
  lowerText.indexOf(' map') !== -1 ||
  lowerText.indexOf('gps') !== -1 ||
  lowerText.indexOf('navigate') !== -1 ||
  buttonId === 'btn_directions'
) {
  const churchLat = 6.6805;
  const churchLng = 3.2350;
  const churchName = 'RCCG Everflourishing Mega Sanctuary';
  const churchAddress = CHURCH_ADDRESS;
  return [{
    json: {
      is_direct: true,
      is_interactive: false,
      is_location: true,
      location_lat: churchLat,
      location_lng: churchLng,
      location_name: churchName,
      location_address: churchAddress,
      direct_reply: \`📍 Here's our location — tap to get live directions from wherever you are.\`,
      image_url: ''
    }
  }];
}

// 5. Service Schedule Default Fallbacks
if (lowerText.indexOf('sunday') !== -1 || lowerText.indexOf('service schedule') !== -1 || lowerText.indexOf('service time') !== -1 || buttonId === 'btn_services') {
  let sundayTopic = \`🎉 *SUNDAY WORSHIP SERVICE*\\n\\n• *1st Service*: *8:00 AM – 9:45 AM*\\n• *Sunday School*: *9:45 AM – 10:15 AM*\\n• *2nd Service*: *10:15 AM – 12:00 PM*\`;
  let sundayFlyer = storageBase + '/Service/First%20Service.jpg';
  const replyText = sundayTopic + '\\n\\n📍 *Location*: Main Sanctuary\\n' + CHURCH_ADDRESS;
  return [{ json: { is_direct: true, is_interactive: false, image_url: sundayFlyer, direct_reply: replyText } }];
}

// 12. Giving
if (buttonId === 'btn_giving' || lowerText.indexOf('tithe') !== -1 || lowerText.indexOf('offering') !== -1 || lowerText.indexOf('account number') !== -1 || (lowerText.indexOf('giving') !== -1 && lowerText.indexOf('thanksgiving') === -1 && lowerText.indexOf('thanks') === -1)) {
  const replyText = \`💳 *CHURCH GIVING & TITHES*\\n\\n🏛️ *Tithe & Offering Account*\\n• *Bank*: Access Bank\\n• *Account Number*: \\\`0695126926\\\`\\n• *Account Name*: RCCG Everflourishing Parish\\n\\n🏗️ *Building Project Account*\\n• *Bank*: United Bank for Africa (UBA)\\n• *Account Number*: \\\`1028494770\\\`\\n• *Account Name*: RCCG EVERFLOURISHING PROJECT\\n\\n_God bless you richly as you give into His sanctuary!_\`;
  return [{ json: { is_direct: true, is_interactive: false, image_url: storageBase + '/Giving/Offering.png', direct_reply: replyText } }];
}

// 15. Greetings
const isGreeting = ['hi', 'hello', 'hey', 'menu', 'start', 'good morning', 'good afternoon', 'good evening'].indexOf(lowerText) !== -1;

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
          body: { text: 'Welcome to RCCG Everflourishing Mega Sanctuary! 🙏\\n\\nHow may we assist you today? Tap an option below, or just type your question.\\n\\nLooking for special programs? Type "special program" 🌟' },
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

// 16. Fallback AI
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

const knowledgeBlock = articles
  .map(function(a) { return '### ' + a.title + '\\n' + a.markdown; })
  .join('\\n\\n');

const systemPrompt = \`You are EVF Bot, the official automated WhatsApp AI assistant for RCCG Everflourishing Mega Sanctuary (Ogun 27 Ota).\\n\\nCURRENT DATE & TIME (WAT): \${watTime}\\n\\nKnowledge base:\\n\${knowledgeBlock}\\n\\nInstructions:\\n- Never generate or hallucinate fake lyrics for hymns or songs. Always instruct users to check churchflow-dashboard.vercel.app/hymns.\\n- Answer user questions directly with exact dates.\\n- Keep replies concise and complete.\`;

return [{
  json: {
    is_direct: false,
    is_interactive: false,
    system_prompt: systemPrompt,
    user_message: userText
  }
}];
`
      },
      "id": "1d08286e-d784-4dc7-9dea-f1eb3956b7cb",
      "name": "Build AI Context",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [ 10272, 3408 ]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 1
          },
          "conditions": [
            {
              "leftValue": "={{$json.is_direct}}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "true"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "7d381a68-bcb7-4182-94b7-651badb7bcd7",
      "name": "Is Direct Quick Reply?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [ 10496, 3408 ]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 1
          },
          "conditions": [
            {
              "leftValue": "={{$json.is_interactive}}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "true"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "812e01f7-c7f9-4579-bdc0-9c867935672b",
      "name": "Is Interactive Buttons?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [ 10720, 3552 ]
    },
    {
      "parameters": {
        "jsCode": "const item = $input.first().json;\nreturn [{\n  json: {\n    reply: item.direct_reply,\n    image_url: item.image_url || '',\n    is_location: item.is_location || false,\n    location_lat: item.location_lat || null,\n    location_lng: item.location_lng || null,\n    location_name: item.location_name || '',\n    location_address: item.location_address || ''\n  }\n}];"
      },
      "id": "a967e459-2430-4036-94a6-121ba6821ac8",
      "name": "Format Direct Reply",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [ 11168, 3168 ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.GROQ_API_KEY}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ model: \"llama-3.1-8b-instant\", messages: [ { role: \"system\", content: $json.system_prompt }, { role: \"user\", content: $json.user_message } ], temperature: 0.7, max_tokens: 1200 }) }}",
        "options": {
          "timeout": 15000
        }
      },
      "id": "37fb1ccd-607e-4d9f-a411-8e45ce5ec411",
      "name": "Call AI",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 10944, 3648 ],
      "retryOnFail": true,
      "maxTries": 2,
      "waitBetweenTries": 1200,
      "onError": "continueErrorOutput"
    },
    {
      "parameters": {
        "jsCode": "const reply = $input.first().json.choices[0].message.content.trim();\nreturn [{ json: { reply, image_url: '' } }];"
      },
      "id": "d5ae5243-e052-4c59-a861-b20a36de87cc",
      "name": "Extract AI Reply",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [ 11168, 3456 ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ conversation_id: $(\"Resolve conversation_id\").first().json.conversation_id, sender: \"assistant\", message: ($json.reply || $json.message || \"Thank you for reaching out to RCCG Everflourishing Mega Sanctuary!\") }) }}",
        "options": {}
      },
      "id": "48b6cc1a-04a7-43de-8ce1-69cedfeec01d",
      "name": "Save Outbound Message",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 11392, 3504 ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://graph.facebook.com/v20.0/{{$json.phone_number_id}}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.WHATSAPP_ACCESS_TOKEN}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ $json.is_location ? { messaging_product: 'whatsapp', to: $json.from_phone, type: 'location', location: { latitude: $json.location_lat, longitude: $json.location_lng, name: $json.location_name, address: $json.location_address } } : (($json.image_url && $json.image_url.trim() !== '') ? { messaging_product: 'whatsapp', to: $json.from_phone, type: 'image', image: { link: $json.image_url, caption: $json.reply } } : { messaging_product: 'whatsapp', to: $json.from_phone, type: 'text', text: { body: $json.reply } }) }}",
        "options": {}
      },
      "id": "e427d373-4962-430f-9498-c65466b1a098",
      "name": "Send WhatsApp Reply",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 11616, 3312 ],
      "retryOnFail": true,
      "maxTries": 2,
      "waitBetweenTries": 800,
      "onError": "continueErrorOutput"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://graph.facebook.com/v20.0/{{$(\"Parse Incoming Message\").first().json.phone_number_id}}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.WHATSAPP_ACCESS_TOKEN}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ $json.interactive_payload }}",
        "options": {}
      },
      "id": "15f4871f-9bbd-45b1-ba02-5c84e0232a5f",
      "name": "Send WhatsApp Buttons",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 10944, 3312 ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://graph.facebook.com/v20.0/{{$json.phone_number_id}}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.WHATSAPP_ACCESS_TOKEN}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { messaging_product: \"whatsapp\", to: $json.from_phone, type: \"text\", text: { body: $json.fallback_text } } }}",
        "options": {}
      },
      "id": "deb882ab-4938-436c-b9c6-c05e79954624",
      "name": "Send Text Fallback (image failed)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 12064, 3264 ]
    },
    {
      "parameters": {
        "jsCode": "let directReply = '';\ntry { directReply = $('Format Direct Reply').first().json.reply || ''; } catch (e) {}\n\nlet aiReply = '';\ntry { aiReply = $('Extract AI Reply').first().json.reply || ''; } catch (e) {}\n\nlet phoneNumberId = '';\nlet fromPhone = '';\ntry {\n  phoneNumberId = $('Parse Incoming Message').first().json.phone_number_id || '';\n  fromPhone = $('Parse Incoming Message').first().json.from_phone || '';\n} catch (e) {}\n\nconst inputData = $json || {};\nconst textReply = inputData.reply || inputData.message || directReply || aiReply || \"Thank you for reaching out to RCCG Everflourishing Mega Sanctuary!\";\n\nreturn [{ json: { fallback_text: textReply, phone_number_id: phoneNumberId, from_phone: fromPhone } }];"
      },
      "id": "92dd6df7-206b-4a0d-b193-7b914901c9d6",
      "name": "Prepare Fallback Text",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [ 11840, 3264 ]
    },
    {
      "parameters": {
        "jsCode": "let directData = {};\ntry { directData = $('Format Direct Reply').first().json || {}; } catch (e) {}\n\nlet aiData = {};\ntry { aiData = $('Extract AI Reply').first().json || {}; } catch (e) {}\n\nconst inputData = $json || {};\nconst textReply = inputData.reply || inputData.message || directData.reply || aiData.reply || '';\nconst flyerUrl = inputData.image_url || directData.image_url || '';\nconst isLocation = inputData.is_location || directData.is_location || false;\n\nlet phoneNumberId = '';\nlet fromPhone = '';\ntry {\n  phoneNumberId = $('Parse Incoming Message').first().json.phone_number_id || '';\n  fromPhone = $('Parse Incoming Message').first().json.from_phone || '';\n} catch (e) {}\n\nreturn [{ json: {\n  reply: textReply,\n  image_url: flyerUrl,\n  phone_number_id: phoneNumberId,\n  from_phone: fromPhone,\n  is_location: isLocation,\n  location_lat: inputData.location_lat || directData.location_lat || null,\n  location_lng: inputData.location_lng || directData.location_lng || null,\n  location_name: inputData.location_name || directData.location_name || '',\n  location_address: inputData.location_address || directData.location_address || ''\n} }];"
      },
      "id": "9c4cb81a-96a1-4034-92d3-29f928697c74",
      "name": "Prepare Reply Payload",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [ 11392, 3312 ]
    },
    {
      "parameters": {
        "jsCode": "let errMsg = '';\ntry { errMsg = JSON.stringify($json.error || $json); } catch (e) { errMsg = String($json); }\n\nconst isRateLimit = /429|rate.?limit|quota/i.test(errMsg);\n\nconst reply = isRateLimit\n  ? \"We're getting a lot of messages right now 🙏 Please give us a moment and try again shortly, or a team member will respond soon.\"\n  : \"We've received your message! Someone from our team will get back to you shortly. 🙏\";\n\nreturn [{ json: { reply, image_url: '' } }];"
      },
      "id": "d965dee3-1bb7-4507-b27a-4eaf3d450a20",
      "name": "AI Fallback Reply",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [ 11168, 3648 ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/error_logs",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ (function(){ let waId=''; try{ waId=$('Parse Incoming Message').first().json.wa_message_id||''; }catch(e){} let errText=''; try{ errText=JSON.stringify($json.error||$json); }catch(e){ errText=String($json); } return { node_name: $prevNode.name, wa_message_id: waId, error_message: errText.slice(0,2000) }; })() }}",
        "options": {}
      },
      "id": "2e8535cf-057e-49bd-8451-357eb94e8daf",
      "name": "Log Error",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 11840, 3760 ],
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 6 * * *"
            }
          ]
        }
      },
      "id": "198b790d-7f13-491c-aa89-bc39e21cd88b",
      "name": "Cron Daily Schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [ 6016, 2528 ]
    },
    {
      "parameters": {
        "jsCode": "const now = new Date();\nconst storageBase = 'https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers';\n\nfunction fmtWAT(d) {\n  return d.toLocaleString('en-US', { timeZone: 'Africa/Lagos', weekday: 'long', month: 'long', day: 'numeric' });\n}\n\nfunction isoDateWAT(d) {\n  return d.toLocaleString('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' });\n}\n\nfunction atWATTime(base, hour, minute) {\n  const dateStr = isoDateWAT(base);\n  return new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+01:00`);\n}\n\nfunction nextWeeklyOccurrence(targetDow, hour, minute) {\n  let d = new Date(now);\n  for (let i = 0; i < 8; i++) {\n    const candidate = atWATTime(d, hour, minute);\n    if (candidate.getDay() === targetDow && candidate.getTime() > now.getTime()) return candidate;\n    d.setDate(d.getDate() + 1);\n  }\n  return atWATTime(now, hour, minute);\n}\n\nfunction nextLastWeekdayOfMonthOccurrence(targetDow, hour, minute) {\n  function lastWeekdayOf(year, month) {\n    const lastDay = new Date(year, month + 1, 0);\n    const diff = (lastDay.getDay() - targetDow + 7) % 7;\n    lastDay.setDate(lastDay.getDate() - diff);\n    return lastDay;\n  }\n  const nowLagos = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));\n  let candidate = atWATTime(lastWeekdayOf(nowLagos.getFullYear(), nowLagos.getMonth()), hour, minute);\n  if (candidate.getTime() <= now.getTime()) {\n    const nextMonth = new Date(nowLagos.getFullYear(), nowLagos.getMonth() + 1, 1);\n    candidate = atWATTime(lastWeekdayOf(nextMonth.getFullYear(), nextMonth.getMonth()), hour, minute);\n  }\n  return candidate;\n}\n\nfunction currentOrNextSundayDate() {\n  const nowLagos = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));\n  const daysUntilSun = (7 - nowLagos.getDay()) % 7;\n  const d = new Date(nowLagos);\n  d.setDate(d.getDate() + daysUntilSun);\n  return d;\n}\nfunction sundayOccurrenceAt(hour, minute) {\n  return atWATTime(currentOrNextSundayDate(), hour, minute);\n}\n\nconst services = [];\n\nservices.push({ name: 'Digging Deep (Bible Study)', occurrence: nextWeeklyOccurrence(2, 18, 0), flyer: storageBase + '/Service/Digging%20Deep.png', verse: '\"Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.\" — 2 Timothy 2:15' });\nservices.push({ name: 'Faith Clinic (Miracle Hour)', occurrence: nextWeeklyOccurrence(4, 18, 0), flyer: storageBase + '/Service/faith%20clinic.jpg', verse: '\"Is any sick among you? let him call for the elders of the church... And the prayer of faith shall save the sick.\" — James 5:14-15' });\nservices.push({ name: 'Youth Vigil (YAYA)', occurrence: nextLastWeekdayOfMonthOccurrence(3, 23, 0), flyer: storageBase + '/Service/Youth%20vigil.jpg', verse: '\"Continue in prayer, and watch in the same with thanksgiving.\" — Colossians 4:2' });\n\nconst sundayBase = currentOrNextSundayDate();\nconst sunDayOfMonth = sundayBase.getDate();\n\nif (sunDayOfMonth <= 7) {\n  services.push({ name: 'Thanksgiving Sunday Service', occurrence: sundayOccurrenceAt(8, 0), flyer: storageBase + '/Service/Thanks.jpg', verse: '\"Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.\" — Psalm 100:4' });\n  services.push({ name: 'Holy Communion Service', occurrence: sundayOccurrenceAt(17, 0), flyer: storageBase + '/Service/Holy%20Communion.jpg', verse: '\"The cup of blessing which we bless, is it not the communion of the blood of Christ?\" — 1 Corinthians 10:16' });\n} else if (sunDayOfMonth <= 14) {\n  services.push({ name: 'Prayer Sunday', occurrence: sundayOccurrenceAt(8, 0), flyer: storageBase + '/Service/Second%20Servivce.jpg', verse: '\"Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not.\" — Jeremiah 33:3' });\n} else if (sunDayOfMonth <= 21) {\n  services.push({ name: 'Youth Sunday', occurrence: sundayOccurrenceAt(8, 0), flyer: storageBase + '/Service/First%20Service.jpg', verse: '\"Let no man despise thy youth; but be thou an example of the believers.\" — 1 Timothy 4:12' });\n} else {\n  services.push({ name: 'Super Sunday / Relationship Sunday', occurrence: sundayOccurrenceAt(8, 0), flyer: storageBase + '/Service/First%20Service.jpg', verse: '\"And above all these things put on charity, which is the bond of perfectness.\" — Colossians 3:14' });\n}\n\nconst todayISO = isoDateWAT(now);\nconst todaysServices = services.filter(svc => isoDateWAT(svc.occurrence) === todayISO);\n\nconst offsets = [\n  { type: '1h', minutes: 60, label: 'in 1 hour' },\n  { type: '30m', minutes: 30, label: 'in 30 minutes' },\n];\n\nconst due = [];\nfor (const svc of todaysServices) {\n  for (const off of offsets) {\n    const sendAt = new Date(svc.occurrence.getTime() - off.minutes * 60000);\n    if (sendAt.getTime() <= now.getTime()) continue;\n\n    const timeLabel = svc.occurrence.toLocaleString('en-US', { timeZone: 'Africa/Lagos', hour: 'numeric', minute: '2-digit' });\n    const dateLabel = fmtWAT(svc.occurrence);\n    const message = `🔔 *REMINDER: ${svc.name.toUpperCase()} — ${off.label.toUpperCase()}!*\\n\\nDear {{FIRST_NAME}}, this is a reminder for our upcoming service.\\n\\n• *Service*: ${svc.name}\\n• *Date*: ${dateLabel}\\n• *Time*: ${timeLabel} WAT\\n📍 *Address*: 7, Powerline Street, Moshalashi B/Stop, Iyana Iyesi, Ota, Ogun State.\\n\\n📖 *Verse*: ${svc.verse}\\n\\nSee you there! God bless you. 🙏`;\n\n    due.push({\n      json: {\n        should_send: true,\n        service_name: svc.name,\n        reminder_type: off.type,\n        dedup_key: `${svc.name} :: ${off.type}`,\n        occurrence_date: isoDateWAT(svc.occurrence),\n        flyer_url: svc.flyer,\n        reminder_message: message,\n        send_at: sendAt.toISOString(),\n        tpl_service_upper: svc.name.toUpperCase(),\n        tpl_offset_upper: off.label.toUpperCase(),\n        tpl_service_name: svc.name,\n        tpl_date_label: dateLabel,\n        tpl_time_label: timeLabel,\n        tpl_verse: svc.verse,\n      }\n    });\n  }\n}\n\ndue.sort((a, b) => new Date(a.json.send_at) - new Date(b.json.send_at));\nreturn due;"
      },
      "id": "6f21d795-e250-4176-9c3d-3da623faefae",
      "name": "Determine Due Reminders",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [ 6240, 2528 ]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 1
          },
          "conditions": [
            {
              "leftValue": "={{$json.should_send}}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "true"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "3ed68736-6047-4a16-9f62-0cb1e2212a50",
      "name": "Should Send Reminder?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [ 6912, 2448 ]
    },
    {
      "parameters": {
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/members?select=phone,full_name,branch_id",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            }
          ]
        },
        "options": {}
      },
      "id": "56514032-3c93-4871-9a79-8cd9573d2b09",
      "name": "Fetch All WhatsApp Members",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 7584, 2448 ]
    },
    {
      "parameters": {
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/whatsapp_sessions?select=phone_number_id&limit=1",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            }
          ]
        },
        "options": {}
      },
      "id": "56e30418-0aaa-47a9-a4d0-02a7d42a19cd",
      "name": "Fetch Phone Number ID",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 7808, 2448 ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://graph.facebook.com/v20.0/{{$json.phone_number_id}}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.WHATSAPP_ACCESS_TOKEN}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { messaging_product: 'whatsapp', to: $json.member_phone, type: 'template', template: { name: 'service_reminder', language: { code: 'en' }, components: [ { type: 'header', parameters: [ { type: 'image', image: { link: $json.flyer_url } } ] }, { type: 'body', parameters: [ { type: 'text', text: $json.tpl_service_upper }, { type: 'text', text: $json.tpl_offset_upper }, { type: 'text', text: $json.tpl_member_name }, { type: 'text', text: $json.tpl_service_name }, { type: 'text', text: $json.tpl_date_label }, { type: 'text', text: $json.tpl_time_label }, { type: 'text', text: $json.tpl_verse } ] } ] } } }}",
        "options": {}
      },
      "id": "06c82d93-a981-4a32-9d0d-c352ab687bb1",
      "name": "Send WhatsApp Broadcast to Member",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 8256, 2528 ],
      "retryOnFail": true,
      "maxTries": 2,
      "waitBetweenTries": 800,
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$vars.SUPABASE_URL}}/rest/v1/reminder_log?on_conflict=service_name,sent_date",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{$vars.SUPABASE_SERVICE_KEY}}"
            },
            {
              "name": "Prefer",
              "value": "resolution=ignore-duplicates,return=representation"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { service_name: $json.dedup_key, sent_date: $json.occurrence_date } }}",
        "options": {}
      },
      "id": "a1e03901-0ea9-40f9-affb-0351b222a10b",
      "name": "Claim Reminder Slot (Dedup)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [ 7136, 2448 ]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "loose",
            "version": 1
          },
          "conditions": [
            {
              "leftValue": "={{$json.id}}",
              "rightValue": "",
              "operator": {
                "type": "string",
                "operation": "exists"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "d0f7dac2-16c8-46c7-90e5-6125cc0250b9",
      "name": "Slot Claimed? (not already sent)",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [ 7360, 2448 ]
    },
    {
      "parameters": {
        "jsCode": "const members = $('Fetch All WhatsApp Members').all();\n\nconst phoneNumberIdData = $input.first().json;\nconst phoneNumberId = Array.isArray(phoneNumberIdData)\n  ? phoneNumberIdData[0]?.phone_number_id\n  : (phoneNumberIdData.phone_number_id || '');\n\nconst results = [];\nfor (let i = 0; i < members.length; i++) {\n  const memberData = members[i].json;\n  const memberPhone = memberData.phone || '';\n  const memberName = (memberData.full_name || '').trim().split(' ')[0] || 'Believer';\n\n  let due = {};\n  try {\n    due = $('Determine Due Reminders').itemMatching(i).json;\n  } catch (e) {}\n\n  results.push({\n    json: {\n      member_phone: memberPhone,\n      phone_number_id: phoneNumberId,\n      flyer_url: due.flyer_url || '',\n      tpl_service_upper: due.tpl_service_upper || '',\n      tpl_offset_upper: due.tpl_offset_upper || '',\n      tpl_member_name: memberName,\n      tpl_service_name: due.tpl_service_name || '',\n      tpl_date_label: due.tpl_date_label || '',\n      tpl_time_label: due.tpl_time_label || '',\n      tpl_verse: due.tpl_verse || '',\n    }\n  });\n}\n\nreturn results;\n"
      },
      "id": "917f926c-80d4-4a4a-9834-1049f552b37a",
      "name": "Prepare Broadcast Payload",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [ 8032, 2448 ]
    },
    {
      "parameters": {
        "options": {}
      },
      "id": "aa2b8d40-1e49-425d-b57a-29e5b958fe47",
      "name": "Loop Reminders",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [ 6464, 2528 ]
    },
    {
      "parameters": {
        "resume": "specificTime",
        "dateTime": "={{$json.send_at}}"
      },
      "id": "a6242c48-fac6-4cd0-9e1f-ba2ef17d9c3c",
      "name": "Wait Until Reminder Time",
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [ 6688, 2448 ],
      "webhookId": "wait-reminder-time-webhook"
    }
  ],
  "pinData": {},
  "connections": {
    "WhatsApp Webhook GET": {
      "main": [ [ { "node": "Verify Token Matches", "type": "main", "index": 0 } ] ]
    },
    "WhatsApp Webhook POST": {
      "main": [ [ { "node": "Respond OK (POST)", "type": "main", "index": 0 }, { "node": "Parse Incoming Message", "type": "main", "index": 0 } ] ]
    },
    "Verify Token Matches": {
      "main": [ [ { "node": "Respond With Challenge", "type": "main", "index": 0 } ], [ { "node": "Respond Forbidden", "type": "main", "index": 0 } ] ]
    },
    "Parse Incoming Message": {
      "main": [ [ { "node": "Is Status Update? (skip)", "type": "main", "index": 0 } ] ]
    },
    "Is Status Update? (skip)": {
      "main": [ [], [ { "node": "Claim Message ID (Dedup)", "type": "main", "index": 0 } ] ]
    },
    "Claim Message ID (Dedup)": {
      "main": [ [ { "node": "New Message? (not duplicate)", "type": "main", "index": 0 } ] ]
    },
    "New Message? (not duplicate)": {
      "main": [ [ { "node": "Send Typing Indicator", "type": "main", "index": 0 } ], [] ]
    },
    "Send Typing Indicator": {
      "main": [ [ { "node": "Restore Parsed Message Data", "type": "main", "index": 0 } ] ]
    },
    "Restore Parsed Message Data": {
      "main": [ [ { "node": "Lookup Branch by Phone Number ID", "type": "main", "index": 0 } ] ]
    },
    "Lookup Branch by Phone Number ID": {
      "main": [ [ { "node": "Extract branch_id", "type": "main", "index": 0 } ] ]
    },
    "Extract branch_id": {
      "main": [ [ { "node": "Upsert Member", "type": "main", "index": 0 } ] ]
    },
    "Upsert Member": {
      "main": [ [ { "node": "Find Open Conversation", "type": "main", "index": 0 } ] ]
    },
    "Find Open Conversation": {
      "main": [ [ { "node": "No Open Conversation?", "type": "main", "index": 0 } ] ]
    },
    "No Open Conversation?": {
      "main": [ [ { "node": "Create Conversation", "type": "main", "index": 0 } ], [ { "node": "Resolve conversation_id", "type": "main", "index": 0 } ] ]
    },
    "Create Conversation": {
      "main": [ [ { "node": "Resolve conversation_id", "type": "main", "index": 0 } ] ]
    },
    "Resolve conversation_id": {
      "main": [ [ { "node": "Save Inbound Message", "type": "main", "index": 0 } ] ]
    },
    "Save Inbound Message": {
      "main": [ [ { "node": "Get Branch Settings", "type": "main", "index": 0 } ] ]
    },
    "Get Branch Settings": {
      "main": [ [ { "node": "Get Active AI Prompt", "type": "main", "index": 0 } ] ]
    },
    "Get Active AI Prompt": {
      "main": [ [ { "node": "Get Knowledge Articles", "type": "main", "index": 0 } ] ]
    },
    "Get Knowledge Articles": {
      "main": [ [ { "node": "Fetch Events", "type": "main", "index": 0 } ] ]
    },
    "Fetch Events": {
      "main": [ [ { "node": "Fetch Special Programs", "type": "main", "index": 0 } ] ]
    },
    "Fetch Special Programs": {
      "main": [ [ { "node": "Build AI Context", "type": "main", "index": 0 } ] ]
    },
    "Build AI Context": {
      "main": [ [ { "node": "Is Direct Quick Reply?", "type": "main", "index": 0 } ] ]
    },
    "Is Direct Quick Reply?": {
      "main": [ [ { "node": "Format Direct Reply", "type": "main", "index": 0 } ], [ { "node": "Is Interactive Buttons?", "type": "main", "index": 0 } ] ]
    },
    "Is Interactive Buttons?": {
      "main": [ [ { "node": "Send WhatsApp Buttons", "type": "main", "index": 0 } ], [ { "node": "Call AI", "type": "main", "index": 0 } ] ]
    },
    "Format Direct Reply": {
      "main": [ [ { "node": "Save Outbound Message", "type": "main", "index": 0 }, { "node": "Prepare Reply Payload", "type": "main", "index": 0 } ] ]
    },
    "Call AI": {
      "main": [ [ { "node": "Extract AI Reply", "type": "main", "index": 0 } ], [ { "node": "AI Fallback Reply", "type": "main", "index": 0 }, { "node": "Log Error", "type": "main", "index": 0 } ] ]
    },
    "Extract AI Reply": {
      "main": [ [ { "node": "Save Outbound Message", "type": "main", "index": 0 }, { "node": "Prepare Reply Payload", "type": "main", "index": 0 } ] ]
    },
    "Prepare Reply Payload": {
      "main": [ [ { "node": "Send WhatsApp Reply", "type": "main", "index": 0 } ] ]
    },
    "Send WhatsApp Reply": {
      "main": [ [], [ { "node": "Prepare Fallback Text", "type": "main", "index": 0 }, { "node": "Log Error", "type": "main", "index": 0 } ] ]
    },
    "Prepare Fallback Text": {
      "main": [ [ { "node": "Send Text Fallback (image failed)", "type": "main", "index": 0 } ] ]
    },
    "AI Fallback Reply": {
      "main": [ [ { "node": "Save Outbound Message", "type": "main", "index": 0 }, { "node": "Prepare Reply Payload", "type": "main", "index": 0 } ] ]
    },
    "Cron Daily Schedule": {
      "main": [ [ { "node": "Determine Due Reminders", "type": "main", "index": 0 } ] ]
    },
    "Determine Due Reminders": {
      "main": [ [ { "node": "Loop Reminders", "type": "main", "index": 0 } ] ]
    },
    "Loop Reminders": {
      "main": [ [], [ { "node": "Wait Until Reminder Time", "type": "main", "index": 0 } ] ]
    },
    "Wait Until Reminder Time": {
      "main": [ [ { "node": "Should Send Reminder?", "type": "main", "index": 0 } ] ]
    },
    "Should Send Reminder?": {
      "main": [ [ { "node": "Claim Reminder Slot (Dedup)", "type": "main", "index": 0 } ] ]
    },
    "Claim Reminder Slot (Dedup)": {
      "main": [ [ { "node": "Slot Claimed? (not already sent)", "type": "main", "index": 0 } ] ]
    },
    "Slot Claimed? (not already sent)": {
      "main": [ [ { "node": "Fetch All WhatsApp Members", "type": "main", "index": 0 } ] ]
    },
    "Fetch All WhatsApp Members": {
      "main": [ [ { "node": "Fetch Phone Number ID", "type": "main", "index": 0 } ] ]
    },
    "Fetch Phone Number ID": {
      "main": [ [ { "node": "Prepare Broadcast Payload", "type": "main", "index": 0 } ] ]
    },
    "Prepare Broadcast Payload": {
      "main": [ [ { "node": "Send WhatsApp Broadcast to Member", "type": "main", "index": 0 } ] ]
    },
    "Send WhatsApp Broadcast to Member": {
      "main": [ [ { "node": "Loop Reminders", "type": "main", "index": 0 } ] ]
    }
  },
  "active": true,
  "settings": {
    "executionOrder": "v1",
    "binaryMode": "separate",
    "availableInMCP": false,
    "timeSavedMode": "fixed",
    "errorWorkflow": "P1D01pWjggZvayyj",
    "callerPolicy": "workflowsFromSameOwner"
  },
  "versionId": "81fbd255-da56-49ef-8dbf-6fe8d54ca40a",
  "meta": {
    "instanceId": "58e646003d00676da4370a3e4fdde916b448508d09adbb5a71f49a4acdb7d140"
  },
  "nodeGroups": [],
  "id": "FGDY265QaHaADJ2n",
  "tags": []
};

fs.writeFileSync('n8n-workflow-churchflow-fixed.json', JSON.stringify(workflow, null, 2));
console.log('Successfully written updated n8n-workflow-churchflow-fixed.json');
