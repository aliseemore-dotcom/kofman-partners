# Commercial enquiry form → Google Sheet + email

1. Create a Google Sheet (e.g. "K+P Commercial enquiries").
2. In the sheet: **Extensions → Apps Script**. Paste the contents of `Code.gs`, save.
3. **Deploy → New deployment → type: Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy and authorise when asked.
4. Copy the **Web app URL** (ends in `/exec`).
5. Paste it into `FORM_ENDPOINT` near the top of the script block in `commercial/index.html`.

Every submission is added as a row on the `Enquiries` sheet and emailed to office@kofmanpartners.com (reply goes to the sender when they gave an email).
After changing `Code.gs`, use **Deploy → Manage deployments → Edit → New version**.
