/**
 * ExamGuard Google Sheets Auto-Backup & Data Cleanup Script
 * 
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Delete everything and paste this entire file.
 * 4. Replace `YOUR_NEXTJS_APP_URL` and `YOUR_CRON_SECRET` below.
 * 5. Run the `setupAndRun` function once to authorize and set up the sheet headers.
 * 6. Set a trigger (Clock icon on the left) to run the `syncExamGuardData` function every 2 hours.
 */

const EXAMGUARD_URL = 'YOUR_NEXTJS_APP_URL'; // Replace this with your Vercel or deployed app URL!
const CRON_SECRET = 'examguard_backup_secret_2026'; // Auto-injected from your .env.local

function setupAndRun() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // Set up headers if empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Session ID', 'Email', 'Student Name', 'Roll No', 'Section', 
      'Form Name', 'Status', 'Score', 'Violations', 'Started At', 'Ended At', 'Reason'
    ]);
    sheet.getRange('A1:L1').setFontWeight('bold');
  }

  // Automatically setup the 2-hour recurring trigger if it doesn't exist
  const triggers = ScriptApp.getProjectTriggers();
  const triggerExists = triggers.some(t => t.getHandlerFunction() === 'syncExamGuardData');
  if (!triggerExists) {
    ScriptApp.newTrigger('syncExamGuardData')
      .timeBased()
      .everyHours(2)
      .create();
    Logger.log('Created 2-hour automatic trigger successfully!');
  }

  syncExamGuardData();
}

function syncExamGuardData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 1. Fetch data from your Next.js export API
  const options = {
    'method': 'get',
    'headers': {
      'Authorization': 'Bearer ' + CRON_SECRET
    },
    'muteHttpExceptions': true
  };
  
  const response = UrlFetchApp.fetch(`${EXAMGUARD_URL}/api/cron/export`, options);
  if (response.getResponseCode() !== 200) {
    Logger.log('Failed to fetch data: ' + response.getContentText());
    return;
  }
  
  const json = JSON.parse(response.getContentText());
  const sessions = json.sessions || [];
  
  // Read existing IDs to avoid duplicates (assuming Session ID is column A)
  const existingData = sheet.getDataRange().getValues();
  const existingIds = new Set();
  // Skip header row
  for (let i = 1; i < existingData.length; i++) {
    existingIds.add(existingData[i][0]);
  }
  
  // Append new sessions
  let added = 0;
  // Reverse to insert oldest first if we want, but they are sorted by started_at desc.
  // Let's just append them.
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    if (!existingIds.has(s.id)) {
      sheet.appendRow([
        s.id, s.email, s.student_name, s.roll_no, s.section,
        s.form_name, s.status, s.score, s.violations, 
        s.started_at, s.ended_at, s.reason
      ]);
      added++;
    }
  }
  Logger.log(`Successfully backed up ${added} new sessions.`);

  // 2. Trigger the cleanup API to delete data older than 7 days from Supabase
  const cleanupOptions = {
    'method': 'post',
    'headers': {
      'Authorization': 'Bearer ' + CRON_SECRET
    },
    'muteHttpExceptions': true
  };
  
  const cleanupRes = UrlFetchApp.fetch(`${EXAMGUARD_URL}/api/cron/cleanup`, cleanupOptions);
  Logger.log('Cleanup response: ' + cleanupRes.getContentText());
}
