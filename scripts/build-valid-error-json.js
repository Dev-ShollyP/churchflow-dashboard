const fs = require('fs');
const path = require('path');

const errorWorkflow = {
  name: "ChurchFlow - Error Handler & Admin Alert",
  nodes: [
    {
      parameters: {},
      id: "e1a90f23-8c45-4df6-817c-errortrigger01",
      name: "Error Trigger",
      type: "n8n-nodes-base.errorTrigger",
      typeVersion: 1,
      position: [400, 300]
    },
    {
      parameters: {
        jsCode: `const input = $input.first().json;

const execution = input.execution || {};
const workflow = input.workflow || {};
const error = execution.error || {};

// Format Lagos WAT Time
const now = new Date();
const watTimeStr = now.toLocaleString('en-US', {
  timeZone: 'Africa/Lagos',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
});

const workflowName = workflow.name || 'ChurchFlow';
const failedNode = execution.lastNodeExecuted || error.node?.name || 'Unknown Node';
const rawErrMsg = error.message || error.description || 'An unexpected error occurred during workflow execution.';
const executionUrl = execution.url || 'https://n8n.cloud/execution/' + (execution.id || '');
const executionId = execution.id || 'N/A';

let shortErr = rawErrMsg;
if (shortErr.length > 400) {
  shortErr = shortErr.substring(0, 397) + '...';
}

const adminMessage = '🚨 *CHURCHFLOW AUTOMATION ALERT* 🚨\\n\\n' +
  'An execution error occurred in the church WhatsApp system.\\n\\n' +
  '📋 *Workflow*: ' + workflowName + '\\n' +
  '⚙️ *Failed Node*: *' + failedNode + '*\\n' +
  '⚠️ *Error*: ' + shortErr + '\\n' +
  '🕒 *Time*: ' + watTimeStr + ' WAT\\n' +
  '🆔 *Execution ID*: ' + executionId + '\\n\\n' +
  '🔗 *View Execution in n8n*:\\n' + executionUrl;

return [{
  json: {
    workflow_name: workflowName,
    failed_node: failedNode,
    error_message: rawErrMsg,
    execution_id: executionId,
    execution_url: executionUrl,
    wat_time: watTimeStr,
    admin_whatsapp_message: adminMessage
  }
}];`
      },
      id: "b2c89012-7d34-4bc5-9012-formatdetails02",
      name: "Format Error Details",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [620, 300]
    },
    {
      parameters: {
        url: "={{$vars.SUPABASE_URL}}/rest/v1/whatsapp_sessions?select=phone_number_id&limit=1",
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
      id: "c3d90123-6e45-4cd6-9123-getphonesess03",
      name: "Get Phone Number ID",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [840, 300],
      alwaysOutputData: true,
      onError: "continueRegularOutput"
    },
    {
      parameters: {
        jsCode: `const sessionData = $input.first().json;
let phoneId = Array.isArray(sessionData) ? sessionData[0]?.phone_number_id : sessionData?.phone_number_id;

if (!phoneId) {
  phoneId = $vars.WHATSAPP_PHONE_NUMBER_ID || '1252855381239526';
}

let adminPhone = ($vars.ADMIN_PHONE || $vars.WHATSAPP_ADMIN_PHONE || '2347030125009').replace(/[^0-9]/g, '');
if (adminPhone.startsWith('0') && adminPhone.length === 11) {
  adminPhone = '234' + adminPhone.slice(1);
}

const formatted = $('Format Error Details').first().json;

return [{
  json: {
    phone_number_id: phoneId,
    admin_phone: adminPhone,
    message: formatted.admin_whatsapp_message,
    workflow_name: formatted.workflow_name,
    failed_node: formatted.failed_node,
    error_message: formatted.error_message,
    execution_id: formatted.execution_id,
    execution_url: formatted.execution_url
  }
}];`
      },
      id: "d4e01234-5f56-4de7-9234-prepadminmsg04",
      name: "Prepare Admin WhatsApp Payload",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1060, 300]
    },
    {
      parameters: {
        method: "POST",
        url: "=https://graph.facebook.com/v20.0/{{$json.phone_number_id}}/messages",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "Authorization",
              value: "=Bearer {{$vars.WHATSAPP_ACCESS_TOKEN}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ { messaging_product: 'whatsapp', to: $json.admin_phone, type: 'text', text: { body: $json.message } } }}",
        options: {}
      },
      id: "e5f12345-4a67-4ef8-9345-sendadminwa05",
      name: "Send WhatsApp Alert to Admin",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1280, 300],
      onError: "continueRegularOutput"
    }
  ],
  pinData: {},
  connections: {
    "Error Trigger": {
      main: [
        [
          {
            node: "Format Error Details",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "Format Error Details": {
      main: [
        [
          {
            node: "Get Phone Number ID",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "Get Phone Number ID": {
      main: [
        [
          {
            node: "Prepare Admin WhatsApp Payload",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "Prepare Admin WhatsApp Payload": {
      main: [
        [
          {
            node: "Send WhatsApp Alert to Admin",
            type: "main",
            index: 0
          }
        ]
      ]
    }
  },
  active: true,
  settings: {
    executionOrder: "v1"
  },
  versionId: "e9124a1b-04f8-42bc-90a1-errorflow001",
  tags: []
};

const filePath = path.join(__dirname, '..', 'n8n-error-workflow-churchflow.json');
fs.writeFileSync(filePath, JSON.stringify(errorWorkflow, null, 2), 'utf8');
console.log('Successfully wrote 100% valid JSON to n8n-error-workflow-churchflow.json');
