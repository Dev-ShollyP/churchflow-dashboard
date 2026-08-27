const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '..', 'n8n-workflow-churchflow-fixed.json');
let workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Find and fix "Prepare Broadcast Payload" node
const prepNode = workflow.nodes.find(n => n.name === 'Prepare Broadcast Payload');
if (prepNode) {
  prepNode.parameters.jsCode = `const allMembers = $('Fetch All WhatsApp Members').all();

// Include all members except explicitly inactive ones
const members = allMembers.filter(function(m) {
  const st = (m.json.membership_status || '').toLowerCase().trim();
  return st !== 'inactive';
});

const phoneNumberIdData = $input.first().json;
let phoneNumberId = Array.isArray(phoneNumberIdData)
  ? phoneNumberIdData[0]?.phone_number_id
  : (phoneNumberIdData?.phone_number_id || '');

if (!phoneNumberId) {
  phoneNumberId = '1252855381239526';
}

const defaultFlyer = 'https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/First%20Service.jpg';

// Get the CURRENT active due reminder from the loop batch (not itemMatching(i))
let due = {};
try {
  due = $('Determine Due Reminders').first().json || {};
} catch (e) {}

// If Loop Reminders is currently processing a specific item
try {
  const currentBatch = $('Loop Reminders').first().json;
  if (currentBatch && currentBatch.service_name) {
    due = currentBatch;
  }
} catch (e) {}

const flyerUrl = (due.flyer_url && due.flyer_url.startsWith('https://')) ? due.flyer_url : defaultFlyer;
let verse = due.tpl_verse || '"The prayer of faith shall save the sick." — James 5:15';
if (verse.length > 300) verse = verse.substring(0, 297) + '...';

const results = [];
for (let i = 0; i < members.length; i++) {
  const memberData = members[i].json;
  let memberPhone = (memberData.phone || '').replace(/[^0-9]/g, '');
  if (memberPhone.startsWith('0') && memberPhone.length === 11) {
    memberPhone = '234' + memberPhone.slice(1);
  } else if (memberPhone.length === 10 && !memberPhone.startsWith('234')) {
    memberPhone = '234' + memberPhone;
  }
  if (!memberPhone || memberPhone.length < 10) continue;

  const memberName = (memberData.full_name || '').trim().split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') || 'Believer';

  results.push({
    json: {
      member_phone: memberPhone,
      phone_number_id: phoneNumberId,
      flyer_url: flyerUrl,
      tpl_service_upper: due.tpl_service_upper || 'FAITH CLINIC (MIRACLE HOUR)',
      tpl_offset_upper: due.tpl_offset_upper || 'UPCOMING',
      tpl_member_name: memberName,
      tpl_service_name: due.tpl_service_name || 'Faith Clinic (Miracle Hour)',
      tpl_date_label: due.tpl_date_label || 'Today',
      tpl_time_label: due.tpl_time_label || '6:00 PM',
      tpl_verse: verse
    }
  });
}

return results;`;
}

fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log('Successfully fixed Prepare Broadcast Payload node in workflow!');
