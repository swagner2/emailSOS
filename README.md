# emailSOS

Data Being Logged to Google Sheets:
Column Structure:

A: Timestamp
B: Domain
C: Email Address
D: Company Name
E: SPF Status (PASS/FAIL)
F: DKIM Status (PASS/FAIL)
G: DMARC Status (PASS/FAIL)
H: MX Status (PASS/FAIL)
I: Domain Issues Count
J: List Size
K: Average Order Value
L: Open Rate
M: Click Rate
N: Conversion Rate
O: Emails Per Month
P: Monthly Revenue Loss
Q: Annual Revenue Loss
R: List Type (calculator/guide)
S: Source

🔧 Setup Required:
Option 1: Google Apps Script (Recommended)

Create a Google Apps Script:

Go to https://script.google.com
Create a new project
Paste this code:

javascriptfunction doPost(e) {
  const sheet = SpreadsheetApp.openById('SHEETID').getActiveSheet();
  
  const data = JSON.parse(e.postData.contents);
  
  sheet.appendRow([
    data.timestamp,
    data.domain,
    data.email,
    data.company,
    data.spf_status,
    data.dkim_status,
    data.dmarc_status,
    data.mx_status,
    data.domain_issues_count,
    data.list_size,
    data.avg_order_value,
    data.open_rate,
    data.click_rate,
    data.conversion_rate,
    data.emails_per_month,
    data.monthly_revenue_loss,
    data.annual_revenue_loss,
    data.list_type,
    data.source
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

Deploy as Web App:

Click "Deploy" → "New deployment"
Type: "Web app"
Execute as: "Me"
Who has access: "Anyone"
Copy the web app URL


Update the React code:

Replace YOUR_APPS_SCRIPT_WEB_APP_URL with your actual URL



Option 2: Google Sheets API (Alternative)

Enable Google Sheets API:

Go to https://console.cloud.google.com
Enable Google Sheets API
Create API key
Replace YOUR_GOOGLE_API_KEY in the code


Set up sheet headers:

Add these headers to row 1 of your sheet:

Timestamp, Domain, Email, Company, SPF Status, DKIM Status, DMARC Status, MX Status, Domain Issues Count, List Size, Avg Order Value, Open Rate, Click Rate, Conversion Rate, Emails Per Month, Monthly Revenue Loss, Annual Revenue Loss, List Type, Source


🎯 What's Already Working:
Data Collection:

Domain and DNS check results
Email addresses and company names
Complete calculator inputs and results
Revenue impact calculations
List type tracking (calculator vs guide)

Automatic Logging:

Triggers when someone provides email for calculator
Triggers when someone requests fix-it guide
Includes all available data at time of submission

Fallback Logging:

Console logs if Google Sheets fails
Manual entry data provided for backup


