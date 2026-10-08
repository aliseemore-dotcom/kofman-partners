// K+P Commercial — enquiry form backend (Google Apps Script).
// Appends every enquiry to a Google Sheet and emails it to NOTIFY_TO.
// SHEET_ID: the long id in the spreadsheet URL (between /d/ and /edit). Paste it in the Apps Script editor only.
var SHEET_ID = 'PASTE_SHEET_ID_HERE';
var NOTIFY_TO = 'office@kofmanpartners.com';
var SHEET_NAME = 'Enquiries';
var HEADERS = ['Received', 'Name', 'Company / brand', 'Email or WhatsApp', 'F&B or Retail', 'Target market(s)', 'Stage', 'Message', 'Consent to personal data processing'];

function doPost(e) {
  var p = e.parameters || {};
  var get = function (k) { return (p[k] && p[k].join(', ')) || ''; };
  if (get('bot-field')) return ContentService.createTextOutput('ok');

  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) { sh.appendRow(HEADERS); sh.setFrozenRows(1); }

  var row = [new Date(), get('name'), get('company'), get('contact'), get('sector'), get('markets'), get('stage'), get('message'), get('consent') === 'yes' ? 'Yes' : 'No'];
  sh.appendRow(row);

  try {
    var body = HEADERS.map(function (h, i) { return h + ': ' + row[i]; }).join('\n');
    var opts = {
      to: NOTIFY_TO,
      subject: 'K+P Commercial enquiry — ' + get('name') + (get('company') ? ' / ' + get('company') : ''),
      body: body
    };
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get('contact').trim())) opts.replyTo = get('contact').trim();
    MailApp.sendEmail(opts);
  } catch (err) {
    console.error('Mail failed: ' + err);
  }

  return ContentService.createTextOutput('ok');
}

function doGet() {
  return ContentService.createTextOutput('ok');
}
