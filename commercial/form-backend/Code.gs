// K+P Commercial — enquiry form backend (Google Apps Script bound to a Google Sheet).
// Appends every enquiry as a row and emails it to NOTIFY_TO.
var NOTIFY_TO = 'office@kofmanpartners.com';
var SHEET_NAME = 'Enquiries';
var HEADERS = ['Received', 'Name', 'Company / brand', 'Email or WhatsApp', 'F&B or Retail', 'Target market(s)', 'Stage', 'Message'];

function doPost(e) {
  var p = e.parameters || {};
  var get = function (k) { return (p[k] && p[k].join(', ')) || ''; };
  if (get('bot-field')) return ContentService.createTextOutput('ok'); // honeypot: bots only

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) { sh.appendRow(HEADERS); sh.setFrozenRows(1); }

  var row = [new Date(), get('name'), get('company'), get('contact'), get('sector'), get('markets'), get('stage'), get('message')];
  sh.appendRow(row);

  var body = HEADERS.map(function (h, i) { return h + ': ' + row[i]; }).join('\n');
  var opts = { to: NOTIFY_TO, subject: 'K+P Commercial enquiry — ' + get('name') + (get('company') ? ' / ' + get('company') : ''), body: body };
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get('contact').trim())) opts.replyTo = get('contact').trim();
  MailApp.sendEmail(opts);

  return ContentService.createTextOutput('ok');
}
